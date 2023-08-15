import PostThread from "@/components/forms/PostThread";
import ProfileHeader from "@/components/share/ProfileHeader";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs"; //know which user is currently creating thread
import { redirect } from "next/navigation";

import { profileTabs } from "@/constants";
import Image from "next/image";
import ThreadsTab from "@/components/share/ThreadsTab";
import UserCard from "@/components/cards/UserCard";

async function Page() {
  const user = await currentUser();

  //if no current log in user
  if (!user) return null;

  //if have user,can fetch data
  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  //fetch all the users
  const result = await fetchUsers({
    userId: user.id,
    searchString: "",
    pageNumber: 1,
    pageSize: 25,
  });

  return (
    <section>
      <h1 className="head-text mb-10">search</h1>

      <div className="mt-14 flex flex-col gap-9">
        {result.users.length === 0 ? (
            <p className="no-result">No users</p>
        ) : (
            <>
                {result.users.map((person) => (
                    <UserCard
                        key={person.id}
                        id={person.id}
                        name={person.name}
                        username={person.username}
                        imgUrl={person.image}
                        personType='User'
                    
                    />

             ))}
            </>
        )}
      </div>
    </section>
  );
}

export default Page;
