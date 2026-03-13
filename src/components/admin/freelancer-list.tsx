"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Mail, 
  GraduationCap, 
  FileText, 
  DollarSign,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Freelancer {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  total_students: number;
  total_applications: number;
  total_earnings: number;
  created_at: string;
}

export function FreelancerList() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    try {
      const response = await fetch("/api/admin/freelancers", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch freelancers");
      }

      const data = await response.json();
      setFreelancers(data.freelancers || []);
    } catch (error) {
      console.error("Error loading freelancers:", error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFreelancers = freelancers.filter(
    (freelancer) =>
      freelancer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search freelancers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Freelancers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFreelancers.map((freelancer) => (
          <Card key={freelancer.id} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {freelancer.full_name || "Unnamed Freelancer"}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Mail className="w-3 h-3" />
                      {freelancer.email}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>View Students</DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {freelancer.total_students}
                  </p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {freelancer.total_applications}
                  </p>
                  <p className="text-xs text-gray-500">Applications</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{freelancer.total_earnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Earnings</p>
                </div>
              </div>

              {/* Join Date */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Joined {new Date(freelancer.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFreelancers.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No freelancers found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? "Try adjusting your search query" 
                : "No freelancers have been registered yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
