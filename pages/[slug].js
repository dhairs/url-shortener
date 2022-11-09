import { useRouter } from "next/router";
import fetch from "node-fetch";
import { server } from "../config/index.js";

const Post = () => {
  return <div>Redirecting you...</div>;
};

async function getRedirect(slug) {
  var fetchReq = await fetch(`${server}/api/${slug}`);
  var data = await fetchReq.json();
  return data;
}

export async function getServerSideProps(context) {
  const { url } = await getRedirect(context.params.slug);
  return {
    redirect: {
      permanent: false,
      destination: `${url}`,
    },
  };
}

export default Post;
