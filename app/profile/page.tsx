'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, User, Lock, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Fetch additional profile data from public.profiles (or users table)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, bio, interests, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUsername(profile.username || '');
        setBio(profile.bio || '');
        setInterests(profile.interests || []);
        setAvatarUrl(profile.avatar_url);
      }

      setLoading(false);
    };

    loadProfile();
  }, [supabase, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Upload avatar if changed
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}.${fileExt}`;

        await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = publicUrl;
      }

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          bio,
          interests,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        });

      alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert('Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Navigation />
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Profile</h1>

        <div className="space-y-10">
          {/* Avatar + Username */}
          <Card>
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <Avatar className="h-28 w-28">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-4xl">
                      {username?.[0]?.toUpperCase() || '👤'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>

                <div className="flex-1 w-full">
                  <Label>Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio & Interests */}
          <Card>
            <CardHeader>
              <CardTitle>About You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Interests</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {interests.map((interest, i) => (
                    <div key={i} className="bg-muted px-4 py-2 rounded-3xl text-sm flex items-center gap-2">
                      {interest}
                      <button
                        onClick={() => setInterests(interests.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add new interest..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newInterest.trim()) {
                        setInterests([...interests, newInterest.trim()]);
                        setNewInterest('');
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (newInterest.trim()) {
                        setInterests([...interests, newInterest.trim()]);
                        setNewInterest('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button onClick={changePassword} className="w-full">
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* My Suggested Learning Path */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                My Personalized Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Your AI-curated learning journey based on your interests and progress.
              </p>

              {/* Placeholder for now */}
              <div className="bg-muted/50 rounded-3xl p-8 text-center">
                <p className="text-muted-foreground">Your learning path will appear here once generated.</p>
                <Button className="mt-6" variant="default">
                  Generate / Update My Learning Path
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save button */}
        <div className="mt-10 flex justify-end">
          <Button onClick={saveProfile} disabled={saving} size="lg">
            {saving ? <Loader2 className="animate-spin mr-2" /> : null}
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}