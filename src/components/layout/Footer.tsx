export function Footer() {
  return (
    <footer className="border-t border-border py-4 px-6 text-center text-sm text-muted-foreground">
      <p>
        ToolBox &mdash; 在线工具箱 &copy; {new Date().getFullYear()} &middot;
        纯前端，无需登录，数据不离开浏览器
      </p>
    </footer>
  );
}
