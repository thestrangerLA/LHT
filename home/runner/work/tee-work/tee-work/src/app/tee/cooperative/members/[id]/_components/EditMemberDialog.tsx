
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react";
import { format, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { CooperativeMember } from '@/lib/types';
import { updateCooperativeMember } from '@/services/cooperativeMemberService';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: CooperativeMember;
}

export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        memberId: member.memberId,
        name: member.name,
        joinDate: member.joinDate,
    });
    
    useEffect(() => {
        setFormData({
            memberId: member.memberId,
            name: member.name,
            joinDate: member.joinDate,
        });
    }, [member, open]);

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSave = async () => {
        try {
            await updateCooperativeMember(member.id, {
                ...formData,
                joinDate: startOfDay(formData.joinDate)
            });
            toast({ title: 'ອັບເດດຂໍ້ມູນສະມາຊິກສຳເລັດ' });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update member:", error);
            toast({ title: 'ເກີດຂໍ້ຜິດພາດ', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ແກ້ໄຂຂໍ້ມູນສະມາຊິກ</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="edit-memberId">ລະຫັດສະມາຊິກ</Label>
                        <Input id="edit-memberId" value={formData.memberId} onChange={e => handleChange('memberId', e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">ຊື່-ນາມສະກຸນ</Label>
                        <Input id="edit-name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-joinDate">ວັນທີສະໝັກ</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.joinDate ? format(formData.joinDate, "PPP") : <span>ເລືອກວັນທີ</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={formData.joinDate} onSelect={(d) => handleChange('joinDate', d)} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ຍົກເລີກ</Button>
                    <Button onClick={handleSave}>ບັນທຶກ</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

