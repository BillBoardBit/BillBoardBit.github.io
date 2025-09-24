import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginArea } from "@/components/auth/LoginArea";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">BillboardBit</h1>
          </div>

          {/* Right side - Login and Theme Toggle */}
          <div className="flex items-center space-x-4">
            <LoginArea className="max-w-60" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}