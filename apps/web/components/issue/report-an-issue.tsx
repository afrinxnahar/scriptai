"use client";
import React from "react";
import { issueTypes } from "../../../../packages/ui/src/utils/data";
import { Button } from "../ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { IconBugFilled } from "@tabler/icons-react";
import { api } from "@/lib/api-client";

const ReportIssue = ({ useIcon }: { useIcon: boolean }) => {
  const [subject, setSubject] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sendingMail, setSendingMail] = React.useState<boolean>(false);

  const handleSendEmail = async (e: Event) => {
    e.preventDefault();
    setSendingMail(true);

    try {
      await api.post("/api/v1/support/report-issue", {
        subject,
        email: email || "",
        body,
      }, { requireAuth: true });

      toast.success("Issue reported successfully!", {
        description: "Thank you for letting us know. We'll look into it soon.",
      });
    } catch (error: any) {
      toast.error("Failed to send issue report", {
        description: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSendingMail(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {useIcon ? (
          <div className="fixed bottom-4 right-4 z-50 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-[#8e8c8c] rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105">
            <IconBugFilled className="text-black w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 dark:hover:text-slate-100 transition-colors hover:text-purple-500 cursor-pointer">
            Report an Issue
          </p>
        )}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        className="min-h-[12rem] w-full sm:w-96 md:w-[32rem] max-w-full p-4 sm:p-6"
      >

        <form className="space-y-4" onSubmit={(e) => handleSendEmail(e as unknown as Event)}>
          <h4 className="font-medium text-lg sm:text-xl">Report an issue</h4>

          <div>
            <p className="text-sm dark:text-slate-100 text-purple-500 mb-2">Feedback Type</p>
            <Select onValueChange={(value) => setSubject(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((issue) => (
                  <SelectItem key={issue.value} value={issue.value}>
                    {issue.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm dark:text-slate-100 text-purple-500 mb-2">Your Email</p>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm dark:text-slate-100 text-purple-500 mb-2">Your Feedback</p>
            <Textarea
              className="min-h-[10rem] sm:min-h-[12rem] md:min-h-[14rem]"
              placeholder="Describe any feedback issue you have"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <PopoverClose asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Close
              </Button>
            </PopoverClose>
            <Button size="sm" disabled={sendingMail} className="w-full sm:w-auto">
              {sendingMail ? "Sending Mail..." : "Submit"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

export default ReportIssue;
