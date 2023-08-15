import PostThread from "@/components/forms/PostThread";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs"; //know which user is currently creating thread
import { redirect } from "next/navigation";

async function Page() {
  const user = await currentUser();

  //if no current log in user
  if (!user) return null;

  //if have user,can fetch data
  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className="head-text">Create thread</h1>

      <PostThread userId={userInfo._id} />
    </>
  );
}

export default Page;
