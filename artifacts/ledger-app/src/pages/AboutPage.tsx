import { Mail, Phone, User, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="max-w-xl mx-auto py-8 space-y-8">
      {/* App branding block */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg">
          <BookOpen className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">LedgerPro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A simple, powerful ledger management tool for businesses of all sizes.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-widest">
            Developer
          </span>
        </div>
      </div>

      {/* Developer card */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6 pb-6 space-y-5">
          {/* Name */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Name</p>
              <p className="font-semibold text-base">Ritik Mishra</p>
            </div>
          </div>

          <div className="border-t" />

          {/* Phone */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Phone</p>
              <a
                href="tel:+918446662115"
                className="font-semibold text-base hover:text-primary transition-colors"
              >
                +91 8446662115
              </a>
            </div>
          </div>

          <div className="border-t" />

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
              <a
                href="mailto:ritik.radharaman.mishra@gmail.com"
                className="font-semibold text-sm hover:text-primary transition-colors break-all"
              >
                ritik.radharaman.mishra@gmail.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} LedgerPro. Built with care.
      </p>
    </div>
  );
}
