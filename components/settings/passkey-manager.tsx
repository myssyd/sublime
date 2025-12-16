"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Passkey {
  id: string;
  name: string | null;
  createdAt: Date;
  deviceType: string;
}

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPasskeys = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.passkey.listUserPasskeys();
      if (result?.data) {
        setPasskeys(result.data as Passkey[]);
      }
    } catch (err) {
      console.error("Failed to fetch passkeys:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    setIsAdding(true);
    setError(null);

    try {
      const result = await authClient.passkey.addPasskey({
        name: newPasskeyName || undefined,
      });

      if (result?.error) {
        setError(result.error.message || "Failed to add passkey");
        return;
      }

      setNewPasskeyName("");
      setDialogOpen(false);
      await fetchPasskeys();
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Passkey registration was cancelled");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to add passkey");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setDeletingId(id);
    try {
      await authClient.passkey.deletePasskey({ id });
      await fetchPasskeys();
    } catch (err) {
      console.error("Failed to delete passkey:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
          </svg>
          Passkeys
        </CardTitle>
        <CardDescription>
          Passkeys are a secure, passwordless way to sign in using your device&apos;s
          biometrics or security key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded bg-muted" />
            <div className="h-12 animate-pulse rounded bg-muted" />
          </div>
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No passkeys registered yet. Add one to enable passwordless sign-in.
          </p>
        ) : (
          <div className="space-y-2">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {passkey.name || "Unnamed Passkey"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {passkey.deviceType} · Added {formatDate(passkey.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePasskey(passkey.id)}
                  disabled={deletingId === passkey.id}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === passkey.id ? "Removing..." : "Remove"}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Passkey
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Passkey</DialogTitle>
              <DialogDescription>
                Register a new passkey using your device&apos;s biometrics or security
                key. You can optionally give it a name to identify it later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="passkey-name">Passkey Name (optional)</Label>
                <Input
                  id="passkey-name"
                  placeholder="e.g., MacBook Pro, iPhone"
                  value={newPasskeyName}
                  onChange={(e) => setNewPasskeyName(e.target.value)}
                  disabled={isAdding}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button onClick={handleAddPasskey} disabled={isAdding}>
                {isAdding ? "Registering..." : "Register Passkey"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
