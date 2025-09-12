import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) return;
    if (password !== confirmPassword) return;
    setSubmitting(true);
    await updatePassword(password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Helmet>
        <title>Redefinir senha - FinanceApp</title>
      </Helmet>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>Defina sua nova senha para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button disabled={submitting} type="submit" className="w-full">
                {submitting ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


