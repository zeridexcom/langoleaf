"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  GraduationCap,
  User,
  ArrowRightLeft,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Student {
  id: string;
  freelancer_id: string;
  freelancer_name: string | null;
  freelancer_email: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

interface Freelancer {
  id: string;
  email: string;
  full_name: string | null;
}

export function StudentAssignment() {
  const [students, setStudents] = useState<Student[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState<string>("");
  const [transferReason, setTransferReason] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load students
      const studentsResponse = await fetch("/api/admin/students", {
        method: "GET",
        credentials: "include",
      });

      // Load freelancers
      const freelancersResponse = await fetch("/api/admin/freelancers", {
        method: "GET",
        credentials: "include",
      });

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students || []);
      }

      if (freelancersResponse.ok) {
        const freelancersData = await freelancersResponse.json();
        setFreelancers(freelancersData.freelancers || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedStudent || !selectedFreelancer) {
      toast.error("Please select both a student and a freelancer");
      return;
    }

    setIsTransferring(true);
    try {
      const response = await fetch("/api/admin/assign-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          studentId: selectedStudent.id,
          newFreelancerId: selectedFreelancer,
          reason: transferReason,
          isTransfer: selectedStudent.freelancer_id !== selectedFreelancer,
        }),
      });

      if (!response.ok) {
        throw new Error("Transfer failed");
      }

      toast.success("Student transferred successfully");
      setDialogOpen(false);
      setSelectedStudent(null);
      setSelectedFreelancer("");
      setTransferReason("");
      loadData(); // Refresh the list
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to transfer student");
    } finally {
      setIsTransferring(false);
    }
  };

  const openTransferDialog = (student: Student) => {
    setSelectedStudent(student);
    setSelectedFreelancer("");
    setTransferReason("");
    setDialogOpen(true);
  };

  const filteredStudents = students.filter(
    (student: Student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
            placeholder="Search students by name, email, or freelancer..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Students Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Current Freelancer
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.freelancer_name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.freelancer_email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                          student.status === "enrolled"
                            ? "bg-green-100 text-green-800"
                            : student.status === "lead"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTransferDialog(student)}
                        className="gap-2"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Transfer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredStudents.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No students found
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "No students have been registered yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transfer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Transfer Student
            </DialogTitle>
            <DialogDescription>
              Transfer <strong>{selectedStudent?.name}</strong> to a different
              freelancer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Current Freelancer
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900">
                  {selectedStudent?.freelancer_name || "Unknown"}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedStudent?.freelancer_email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                New Freelancer
              </label>
              <Select
                value={selectedFreelancer}
                onValueChange={setSelectedFreelancer}
              >
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Select a freelancer" />
                </SelectTrigger>
                <SelectContent>
                  {freelancers.map((freelancer) => (
                    <SelectItem key={freelancer.id} value={freelancer.id}>
                      {freelancer.full_name || freelancer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Reason (Optional)
              </label>
              <Input
                placeholder="Enter reason for transfer..."
                value={transferReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferReason(e.target.value)}
                className="border-gray-200"
              />
            </div>

            {selectedFreelancer &&
              selectedStudent?.freelancer_id === selectedFreelancer && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    This student is already assigned to this freelancer.
                  </p>
                </div>
              )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={
                isTransferring ||
                !selectedFreelancer ||
                selectedStudent?.freelancer_id === selectedFreelancer
              }
              className="gap-2"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Transfer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
