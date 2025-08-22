import { useLocation } from "react-router-dom";
import WelcomeText from "../../components/ui/WelcomeText.jsx";
import FeaturedStories from "../blog/FeaturedStories.jsx";
import JoinNewsletter from "../ui/JoinNewsletter.jsx";
import TrendingPost from "../blog/TrendingPost.jsx";
import Footer from "./Footer.jsx";
import EditorsPick from "../blog/EditorsPick.jsx";

export default function LayoutWrapper({ children }) {
  const location = useLocation();

  return (
    <div>
      {children}

      {location.pathname === "/" && (
        <>
          <section>
            <WelcomeText />

            <FeaturedStories />
            <EditorsPick />
            <JoinNewsletter />
            <TrendingPost />
          </section>

          <Footer />
        </>
      )}
    </div>
  );
}
