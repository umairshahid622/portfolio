import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const Layout = () => {
  return (
    <main>
      <Header></Header>
      <div className="max-w-7xl mx-auto px-4">
        <Outlet></Outlet>
      </div>
    </main>
  );
};

export default Layout;
