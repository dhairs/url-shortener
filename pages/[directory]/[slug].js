import { useRouter } from "next/router";
import fetch from "node-fetch";
import { server } from "../../config/index.js";

const Post = () => {
  return <div>Redirecting you...</div>;
};

async function getRedirectWithDirectory(slug, directory) {
  var fetchReq = await fetch(`${server}/api/${directory}/${slug}`);
  var data = await fetchReq.json();
  return data;
}

export async function getServerSideProps(context) {
  const { url } = await getRedirectWithDirectory(
    context.params.slug,
    context.params.directory
  );
  return {
    redirect: {
      permanent: false,
      destination: `${url}`,
    },
  };
}

export default Post;
