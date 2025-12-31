'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { borrowApi, bookApi, userApi } from '@/lib/api';
import { BorrowRecord, Book, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BorrowsPage() {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 新增借阅对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    book_id: '',
    days: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  // 归还确认对话框
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningRecord, setReturningRecord] = useState<BorrowRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await borrowApi.getBorrows(
        currentPage,
        10,
        statusFilter === 'all' ? undefined : statusFilter
      );
      setRecords(response.records || []);
      setTotalPages(response.pages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error('获取借阅记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const fetchBooksAndUsers = async () => {
    try {
      const [booksRes, usersRes] = await Promise.all([
        bookApi.getBooks(1, 100),
        userApi.getUsers(1, 100),
      ]);
      setBooks(booksRes.books?.filter((b) => b.is_available) || []);
      setUsers(usersRes.users || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ user_id: '', book_id: '', days: 30 });
    fetchBooksAndUsers();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.user_id || !formData.book_id) {
      toast.error('请选择用户和图书');
      return;
    }

    setSubmitting(true);
    try {
      await borrowApi.createBorrow({
        user_id: parseInt(formData.user_id),
        book_id: parseInt(formData.book_id),
        days: formData.days,
      });
      toast.success('借阅成功');
      setDialogOpen(false);
      fetchRecords();
    } catch (error) {
      toast.error('借阅失败');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

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

  const getStatusBadge = (record: BorrowRecord) => {
    if (record.status === 'returned') {
      return <Badge variant="secondary">已归还</Badge>;
    }
    if (record.is_overdue) {
      return <Badge variant="destructive">已逾期</Badge>;
    }
    return <Badge variant="default">借阅中</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">借阅管理</h1>
          <p className="text-muted-foreground">
            {isAdmin ? '管理所有借阅记录' : '查看我的借阅记录'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                办理借阅
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>办理借阅</DialogTitle>
                <DialogDescription>为用户办理图书借阅</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>选择用户 *</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, user_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择用户" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} (@{user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>选择图书 *</Label>
                  <Select
                    value={formData.book_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, book_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择图书" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id.toString()}>
                          {book.title} (可借: {book.available})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">借阅天数</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    max={90}
                    value={formData.days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        days: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  确认借阅
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>借阅记录</CardTitle>
          <CardDescription>共 {total} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 筛选栏 */}
          <div className="flex gap-4 mb-6">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="borrowed">借阅中</SelectItem>
                <SelectItem value="returned">已归还</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 表格 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无借阅记录</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>图书</TableHead>
                    {isAdmin && <TableHead>借阅人</TableHead>}
                    <TableHead>借阅日期</TableHead>
                    <TableHead>应还日期</TableHead>
                    <TableHead>归还日期</TableHead>
                    <TableHead className="text-center">状态</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right">操作</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.book?.title || `图书 #${record.book_id}`}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {record.user?.name || `用户 #${record.user_id}`}
                        </TableCell>
                      )}
                      <TableCell>{formatDate(record.borrow_date)}</TableCell>
                      <TableCell>{formatDate(record.due_date)}</TableCell>
                      <TableCell>
                        {record.return_date
                          ? formatDate(record.return_date)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {record.status === 'borrowed' && (
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
                          )}
                        </TableCell>
                      )}
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