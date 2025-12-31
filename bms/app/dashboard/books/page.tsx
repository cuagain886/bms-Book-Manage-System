'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { bookApi, borrowApi, userApi } from '@/lib/api';
import { Book, User } from '@/lib/types';
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
  Search,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookPlus,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BooksPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'title' | 'author' | 'isbn'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 新增/编辑对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // 借阅对话框
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [borrowingBook, setBorrowingBook] = useState<Book | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [borrowFormData, setBorrowFormData] = useState({
    user_id: '',
    days: 30,
  });
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (searchKeyword) {
        response = await bookApi.searchBooks({
          keyword: searchKeyword,
          type: searchType,
          page: currentPage,
          per_page: 10,
        });
      } else {
        response = await bookApi.getBooks(currentPage, 10);
      }
      setBooks(response.books || []);
      setTotalPages(response.pages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error('获取图书列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, searchType, currentPage]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBooks();
  };

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        quantity: book.quantity,
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: '',
        author: '',
        isbn: '',
        quantity: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.author || !formData.isbn) {
      toast.error('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBook) {
        await bookApi.updateBook(editingBook.id, formData);
        toast.success('图书更新成功');
      } else {
        await bookApi.createBook(formData);
        toast.success('图书添加成功');
      }
      setDialogOpen(false);
      fetchBooks();
    } catch (error) {
      toast.error(editingBook ? '更新失败' : '添加失败');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBook) return;

    try {
      await bookApi.deleteBook(deletingBook.id);
      toast.success('图书删除成功');
      setDeleteDialogOpen(false);
      setDeletingBook(null);
      fetchBooks();
    } catch (error) {
      toast.error('删除失败，可能存在未归还的借阅');
      console.error(error);
    }
  };

  // 打开借阅对话框
  const handleOpenBorrowDialog = async (book: Book) => {
    setBorrowingBook(book);
    setBorrowFormData({
      user_id: isAdmin ? '' : (currentUser?.id.toString() || ''),
      days: 30,
    });
    
    // 如果是管理员，获取用户列表
    if (isAdmin) {
      try {
        const response = await userApi.getUsers(1, 100);
        setUsers(response.users || []);
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    }
    
    setBorrowDialogOpen(true);
  };

  // 处理借阅
  const handleBorrow = async () => {
    if (!borrowingBook) return;
    
    const userId = isAdmin ? borrowFormData.user_id : currentUser?.id.toString();
    
    if (!userId) {
      toast.error('请选择借阅用户');
      return;
    }

    setBorrowSubmitting(true);
    try {
      await borrowApi.createBorrow({
        user_id: parseInt(userId),
        book_id: borrowingBook.id,
        days: borrowFormData.days,
      });
      toast.success('借阅成功');
      setBorrowDialogOpen(false);
      setBorrowingBook(null);
      fetchBooks();
    } catch (error) {
      toast.error('借阅失败，请联系管理员');
      console.error(error);
    } finally {
      setBorrowSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">图书管理</h1>
          <p className="text-muted-foreground">浏览和管理图书馆藏书</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                新增图书
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBook ? '编辑图书' : '新增图书'}
                </DialogTitle>
                <DialogDescription>
                  {editingBook ? '修改图书信息' : '添加新的图书到馆藏'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">书名 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="请输入书名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">作者 *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    placeholder="请输入作者"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN *</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) =>
                      setFormData({ ...formData, isbn: e.target.value })
                    }
                    placeholder="请输入ISBN号"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">数量</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
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
                  {editingBook ? '保存' : '添加'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>图书列表</CardTitle>
          <CardDescription>共 {total} 本图书</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索图书..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Select
                value={searchType}
                onValueChange={(value) =>
                  setSearchType(value as typeof searchType)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="title">书名</SelectItem>
                  <SelectItem value="author">作者</SelectItem>
                  <SelectItem value="isbn">ISBN</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
          </div>

          {/* 表格 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无图书数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>书名</TableHead>
                    <TableHead>作者</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead className="text-center">库存</TableHead>
                    <TableHead className="text-center">可借</TableHead>
                    <TableHead className="text-center">状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {book.isbn}
                      </TableCell>
                      <TableCell className="text-center">
                        {book.quantity}
                      </TableCell>
                      <TableCell className="text-center">
                        {book.available}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={book.is_available ? 'default' : 'secondary'}
                        >
                          {book.is_available ? '可借' : '已借完'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* 借阅按钮 - 管理员可以为任何用户借阅 */}
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenBorrowDialog(book)}
                              disabled={!book.is_available}
                            >
                              <BookPlus className="h-4 w-4 mr-1" />
                              借阅
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(book)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeletingBook(book);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
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

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除图书《{deletingBook?.title}》吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 借阅对话框 */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>借阅图书</DialogTitle>
            <DialogDescription>
              为用户办理《{borrowingBook?.title}》的借阅
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label>选择用户 *</Label>
                <Select
                  value={borrowFormData.user_id}
                  onValueChange={(value) =>
                    setBorrowFormData({ ...borrowFormData, user_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择借阅用户" />
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
            )}
            <div className="space-y-2">
              <Label htmlFor="borrow-days">借阅天数</Label>
              <Input
                id="borrow-days"
                type="number"
                min={1}
                max={90}
                value={borrowFormData.days}
                onChange={(e) =>
                  setBorrowFormData({
                    ...borrowFormData,
                    days: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <strong>图书信息：</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                书名：{borrowingBook?.title}
              </p>
              <p className="text-sm text-muted-foreground">
                作者：{borrowingBook?.author}
              </p>
              <p className="text-sm text-muted-foreground">
                可借数量：{borrowingBook?.available}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBorrowDialogOpen(false)}
              disabled={borrowSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleBorrow} disabled={borrowSubmitting}>
              {borrowSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              确认借阅
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}