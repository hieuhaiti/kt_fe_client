import Header from "@/components/layout/Header";
import FloatButton from "@/components/common/FloatButton";

const NewsLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <FloatButton />
    </div>
  );
};

export default NewsLayout;
