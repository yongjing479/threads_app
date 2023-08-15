"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import { skip } from "node:test";


interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function createThread({text,author,communityId,path}:Params){
    try {
        connectToDB();

    const createThread = await Thread.create({
        text,
        author,
        community:null,
    });


    //Update user model
    await User.findByIdAndUpdate(author,{
        $push:{threads:createThread._id}
    });

    //make sure changes happen immediately on the website
    revalidatePath(path);
    } catch (error:any) {
        throw new Error(`Error creating thread :${error.message}`);
        
    }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20){
    connectToDB();

    //calclate number of posts to skip
    const skipAmount = (pageNumber - 1) * pageSize;

   
    //Fetch the post that have no parents(top leve threads)
    const postsQuery = Thread.find({ parentId : {$in : [null,undefined]} })
    .sort({createdAt: 'desc'})
    .skip(skipAmount)
    .limit(pageSize)
    .populate({path: 'author', model:User})
    .populate({
        path: 'children',
        populate:{
            path:'author',
            model:User,
            select:"_id name parentId image "
        }
    });

    const totalPostsCount = await Thread.countDocuments({parentId:{$in:[null,undefined]}});

    const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;
    
    return{
        posts,isNext
    }


}

export async function fetchThreadById(id:string){
    connectToDB();

    try {

        //populate community
        const thread = await Thread.findById(id)
        .populate({
            path: 'author', 
            model:User , 
            select:"_id id name image"
        })
        .populate({
            path: 'children',
            populate:[
                {
                    path:'author',
                    model:User,
                    select:"_id name parentId image "

                },
                {
                    path:'children',
                    model: Thread,
                    populate:{
                        path:'author',
                        model:User,
                        select:"_id name parentId image "
                    }
                }
            ]
        }).exec();

        return thread;
        
    } catch (error : any) {
            throw new Error(`Error fetching thread by id : ${error.message}`);        
    }
}

export async function addCommentToThread(
    threadId:string,
    commentText:string,
    userId:string,
    path:string
){
    connectToDB();

    try{

        //adding a comment
        //1. find ori thread by id
        const originalThread = await Thread.findById(threadId);
        if(!originalThread){
            throw new Error("Thread not found");
        }

        //2.crete new thread with comment text
        const commentThread = new Thread({
            text:commentText,
            author:userId,
            parentId:threadId,
        })

        //3. save new thread
        const savedCommentThread = await commentThread.save();

        //4. update ori thread to include new comment
        originalThread.children.push(savedCommentThread._id);

        //save original thrad
        await originalThread.save();

        //make sure changes happen immediately on the website
        revalidatePath(path);

    }catch(error:any){
        throw new Error(`Error adding comment to thread : ${error.message}`);
    }

}

export async function fetchUserPost(userId:string){
    try {
        connectToDB();

        //find all threads authored by the user with given userid
        const threads = await User.findOne({id:userId})
        .populate({
            path:'threads',
            model:Thread,
            populate:{
                path:'children',
                model:Thread,
                populate:{
                    path:'author',
                    model:User,
                    select:"name image id"
                }
            }
        })

        return threads;
        
    } catch (error : any) {
        throw new Error(`Error fetching user post : ${error.message}`);
    }
}