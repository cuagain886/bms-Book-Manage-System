'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { bookApi, borrowApi, userApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookCopy, Users, ClipboardList, AlertTriangle, BookOpen, Clock } from 'lucide-react';
import { BorrowRecord } from '@/lib/types';

interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  totalBorrows: number;
  overdueBorrows: number;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalUsers: 0,
    totalBorrows: 0,
    overdueBorrows: 0,
  });
  const [recentBorrows, setRecentBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [booksRes, borrowsRes] = await Promise.all([
          bookApi.getBooks(1, 1),
          borrowApi.getBorrows(1, 5),
        ]);

        const newStats: DashboardStats = {
          totalBooks: booksRes.total || 0,
          totalUsers: 0,
          totalBorrows: borrowsRes.total || 0,
          overdueBorrows: 0,
        };

        if (isAdmin) {
          try {
            const [usersRes, overdueRes] = await Promise.all([
              userApi.getUsers(1, 1),
              borrowApi.getOverdueBorrows(1, 1),
            ]);
            newStats.totalUsers = usersRes.total || 0;
            newStats.overdueBorrows = overdueRes.total || 0;
          } catch {
            // 非管理员可能无权访问
          }
        }

        setStats(newStats);
        setRecentBorrows(borrowsRes.records || []);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          欢迎回来，{user?.name}
        </h1>
        <p className="text-muted-foreground">
          这是您的图书管理系统仪表板概览
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">图书总数</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalBooks}
            </div>
            <p className="text-xs text-muted-foreground">馆藏图书数量</p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">用户总数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">注册用户数量</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">借阅记录</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalBorrows}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? '全部借阅记录' : '我的借阅记录'}
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">逾期记录</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {loading ? '...' : stats.overdueBorrows}
              </div>
              <p className="text-xs text-muted-foreground">待处理逾期</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最近借阅
            </CardTitle>
            <CardDescription>
              {isAdmin ? '系统最近的借阅记录' : '您最近的借阅记录'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                加载中...
              </div>
            ) : recentBorrows.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                暂无借阅记录
              </div>
            ) : (
              <div className="space-y-4">
                {recentBorrows.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {record.book?.title || `图书 #${record.book_id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAdmin && record.user?.name
                            ? `${record.user.name} · `
                            : ''}
                          {formatDate(record.borrow_date)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        record.status === 'returned'
                          ? 'secondary'
                          : record.is_overdue
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {record.status === 'returned'
                        ? '已归还'
                        : record.is_overdue
                        ? '已逾期'
                        : '借阅中'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookCopy className="h-5 w-5" />
              快捷操作
            </CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/dashboard/books"
                className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <BookCopy className="h-8 w-8 mb-2 text-primary" />
                <span className="text-sm font-medium">浏览图书</span>
              </a>
              <a
                href="/dashboard/borrows"
                className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <ClipboardList className="h-8 w-8 mb-2 text-primary" />
                <span className="text-sm font-medium">借阅记录</span>
              </a>
              {isAdmin && (
                <>
                  <a
                    href="/dashboard/users"
                    className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <span className="text-sm font-medium">用户管理</span>
                  </a>
                  <a
                    href="/dashboard/overdue"
                    className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <AlertTriangle className="h-8 w-8 mb-2 text-destructive" />
                    <span className="text-sm font-medium">逾期处理</span>
                  </a>
                </>
              )}
              {!isAdmin && (
                <a
                  href="/dashboard/profile"
                  className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">个人中心</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}