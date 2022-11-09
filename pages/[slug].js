import { useRouter } from "next/router";
import fetch from "node-fetch";

const Post = () => {
  const router = useRouter();
  const { slug } = router.query;
  var url;
  fetch(`/api/${slug}`).then((res) =>
    res.json().then((data) => {
      url = data.url;
      router.replace(url);
    })
  );

  return <div>Redirecting you...</div>;
};

export default Post;
