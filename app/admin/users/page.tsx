import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, UserCheck, UserX, Crown, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  // Mock data - in real app, this would come from database
  const users = [
    {
      id: '1',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      role: 'content-creator',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2024-01-20',
      contentCount: 12
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      fullName: 'Jane Smith',
      role: 'user',
      status: 'active',
      joinDate: '2024-01-10',
      lastActive: '2024-01-19',
      contentCount: 0
    },
    {
      id: '3',
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-01',
      lastActive: '2024-01-20',
      contentCount: 25
    }
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />
      case 'content-creator':
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>
      case 'content-creator':
        return <Badge className="bg-blue-100 text-blue-800">Content Creator</Badge>
      default:
        return <Badge variant="secondary">User</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="destructive">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">User Management</h1>
                  <p className="text-muted-foreground">
                    Manage user accounts, roles, and permissions
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Back to Admin
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">currently active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Content Creators</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.role === 'content-creator').length}
                  </div>
                  <p className="text-xs text-muted-foreground">active creators</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admins</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                  <p className="text-xs text-muted-foreground">system administrators</p>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  A list of all users in the system with their roles and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.status)}
                        </TableCell>
                        <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                        <TableCell>{user.contentCount} items</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}