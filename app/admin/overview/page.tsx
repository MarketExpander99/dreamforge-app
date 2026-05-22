'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';

const AdminOverviewPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold">Admin Overview</h1>
            <p className="text-zinc-400 mt-1">Platform health • Content • Users • Achievements</p>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-400">
            Live • All systems operational
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Students</CardTitle>
              <Users className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">2,847</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3" /> +14% this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Active Courses</CardTitle>
              <BookOpen className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">184</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3" /> +8 new this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Achievements Unlocked</CardTitle>
              <Award className="h-5 w-5 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">12,394</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3" /> +421 today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Discover Sessions</CardTitle>
              <TrendingUp className="h-5 w-5 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">943</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3" /> +23% since launch
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle>Quick Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex-col gap-2 bg-zinc-800 hover:bg-zinc-700">
              <BookOpen className="h-6 w-6" />
              Manage Content
            </Button>
            <Button className="h-20 flex-col gap-2 bg-zinc-800 hover:bg-zinc-700">
              <Users className="h-6 w-6" />
              View Users
            </Button>
            <Button className="h-20 flex-col gap-2 bg-zinc-800 hover:bg-zinc-700">
              <Award className="h-6 w-6" />
              Review Achievements
            </Button>
            <Button className="h-20 flex-col gap-2 bg-zinc-800 hover:bg-zinc-700">
              📡 Monitor Discover
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-500 mt-12">
          Skill Gain Admin Dashboard • Discover module integrated successfully
        </p>
      </div>
    </div>
  );
};

export default AdminOverviewPage;