'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { borrowApi } from '@/lib/api';
import { BorrowRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  User,
  BookOpen,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi, userApi } from '@/lib/api';

export default function ProfilePage() {
  const { user, refreshUser, isAdmin } = useAuth();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 修改个人信息
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 修改密码
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await borrowApi.getUserBorrows(
        user.id,
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
  }, [user, currentPage, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleEditSubmit = async () => {
    if (!user || !editFormData.name) {
      toast.error('请填写姓名');
      return;
    }

    setEditSubmitting(true);
    try {
      await userApi.updateUser(user.id, {
        name: editFormData.name,
        phone: editFormData.phone || undefined,
      });
      toast.success('个人信息更新成功');
      setEditDialogOpen(false);
      refreshUser();
    } catch (error) {
      toast.error('更新失败');
      console.error(error);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordFormData.old_password || !passwordFormData.new_password) {
      toast.error('请填写完整信息');
      return;
    }

    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    if (passwordFormData.new_password.length < 6) {
      toast.error('新密码长度至少为6位');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await authApi.changePassword({
        old_password: passwordFormData.old_password,
        new_password: passwordFormData.new_password,
      });
      toast.success('密码修改成功');
      setPasswordDialogOpen(false);
      setPasswordFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error('密码修改失败，请检查旧密码是否正确');
      console.error(error);
    } finally {
      setPasswordSubmitting(false);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">个人中心</h1>
        <p className="text-muted-foreground">管理您的个人信息和查看借阅记录</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 个人信息卡片 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              个人信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">用户名</p>
                <p className="font-medium">@{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">姓名</p>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">手机号/学号</p>
                <p className="font-medium">{user?.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">角色</p>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  {isAdmin ? '管理员' : '普通用户'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">注册时间</p>
                <p className="font-medium">
                  {user?.created_at ? formatDate(user.created_at) : '-'}
                </p>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    修改信息
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>修改个人信息</DialogTitle>
                    <DialogDescription>更新您的个人资料</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">姓名</Label>
                      <Input
                        id="edit-name"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">手机号/学号</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="请输入手机号或学号"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                      disabled={editSubmitting}
                    >
                      取消
                    </Button>
                    <Button onClick={handleEditSubmit} disabled={editSubmitting}>
                      {editSubmitting && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      保存
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    修改密码
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>修改密码</DialogTitle>
                    <DialogDescription>请输入旧密码和新密码</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="old-password">旧密码</Label>
                      <Input
                        id="old-password"
                        type="password"
                        value={passwordFormData.old_password}
                        onChange={(e) =>
                          setPasswordFormData({
                            ...passwordFormData,
                            old_password: e.target.value,
                          })
                        }
                        placeholder="请输入旧密码"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">新密码</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordFormData.new_password}
                        onChange={(e) =>
                          setPasswordFormData({
                            ...passwordFormData,
                            new_password: e.target.value,
                          })
                        }
                        placeholder="请输入新密码（至少6位）"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">确认新密码</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordFormData.confirm_password}
                        onChange={(e) =>
                          setPasswordFormData({
                            ...passwordFormData,
                            confirm_password: e.target.value,
                          })
                        }
                        placeholder="请再次输入新密码"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(false)}
                      disabled={passwordSubmitting}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handlePasswordSubmit}
                      disabled={passwordSubmitting}
                    >
                      {passwordSubmitting && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      确认修改
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* 借阅记录 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              我的借阅
            </CardTitle>
            <CardDescription>共 {total} 条借阅记录</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="borrowed">借阅中</TabsTrigger>
                <TabsTrigger value="returned">已归还</TabsTrigger>
              </TabsList>

              <TabsContent value={statusFilter} className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无借阅记录</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>图书</TableHead>
                          <TableHead>借阅日期</TableHead>
                          <TableHead>应还日期</TableHead>
                          <TableHead className="text-center">状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.book?.title || `图书 #${record.book_id}`}
                            </TableCell>
                            <TableCell>
                              {formatDate(record.borrow_date)}
                            </TableCell>
                            <TableCell>{formatDate(record.due_date)}</TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(record)}
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
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}