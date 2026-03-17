"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemAnalytics } from "./system-analytics";
import { FreelancerList } from "./freelancer-list";
import { StudentAssignment } from "./student-assignment";
import { TaskVerification } from "./task-verification";
import { Shield, Users, BarChart3, UserCog, ClipboardList } from "lucide-react";
import { useAdminAccess } from "@/hooks/usePermissions";

export function AdminDashboard() {
  const { isAdmin, isLoading } = useAdminAccess();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-none h-8 w-8 border-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Admin Portal</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">System Administration</h1>
          <p className="text-gray-500 text-sm">Manage freelancers, students, and view system analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-bold"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="freelancers"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-bold"
          >
            <Users className="w-4 h-4 mr-2" />
            Freelancers
          </TabsTrigger>
          <TabsTrigger 
            value="students"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-bold"
          >
            <UserCog className="w-4 h-4 mr-2" />
            Student Assignment
          </TabsTrigger>
          <TabsTrigger 
            value="tasks"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-bold"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Task Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <SystemAnalytics />
        </TabsContent>

        <TabsContent value="freelancers" className="mt-6">
          <FreelancerList />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <StudentAssignment />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
}
