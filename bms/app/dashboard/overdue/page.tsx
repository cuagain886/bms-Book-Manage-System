'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { borrowApi } from '@/lib/api';
import { BorrowRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function OverduePage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 归还确认对话框
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningRecord, setReturningRecord] = useState<BorrowRecord | null>(null);

  // 检查权限
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await borrowApi.getOverdueBorrows(currentPage, 10);
      setRecords(response.records || []);
      setTotalPages(response.pages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error('获取逾期记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (isAdmin) {
      fetchRecords();
    }
  }, [fetchRecords, isAdmin]);

  const handleReturn = async () => {
    if (!returningRecord) return;

    try {
      await borrowApi.returnBook(returningRecord.id);
      toast.success('归还成功');
      setReturnDialogOpen(false);
      setReturningRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error('归还失败');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getOverdueDays = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">逾期记录</h1>
        <p className="text-muted-foreground">管理逾期未还的借阅记录</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            逾期借阅
          </CardTitle>
          <CardDescription>共 {total} 条逾期记录</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 表格 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无逾期记录</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>图书</TableHead>
                    <TableHead>借阅人</TableHead>
                    <TableHead>借阅日期</TableHead>
                    <TableHead>应还日期</TableHead>
                    <TableHead className="text-center">逾期天数</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.book?.title || `图书 #${record.book_id}`}
                      </TableCell>
                      <TableCell>
                        {record.user?.name || `用户 #${record.user_id}`}
                        {record.user?.phone && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({record.user.phone})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(record.borrow_date)}</TableCell>
                      <TableCell>{formatDate(record.due_date)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive">
                          {getOverdueDays(record.due_date)} 天
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReturningRecord(record);
                            setReturnDialogOpen(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          归还
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  第 {currentPage} 页，共 {totalPages} 页
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 归还确认对话框 */}
      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认归还</AlertDialogTitle>
            <AlertDialogDescription>
              确定要归还图书《{returningRecord?.book?.title}》吗？
              该图书已逾期 {returningRecord && getOverdueDays(returningRecord.due_date)} 天。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn}>确认归还</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}