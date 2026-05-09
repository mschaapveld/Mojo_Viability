import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [town, setTown] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          town,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate('/projects');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Mojo Viability</CardTitle>
          <CardDescription>Tell us a little about yourself before you get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="town">Town or suburb</Label>
              <Input id="town" value={town} onChange={(e) => setTown(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
