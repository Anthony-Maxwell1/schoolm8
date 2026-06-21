"use client";

import { useAuth } from "@/context/authContext";
import { Text, Divider, Alert, Button, Modal, TextInput } from "@/components/ui/components";
import { useState } from "react";
import { LogOut, Mail, Trash2, User } from "lucide-react";

export default function AccountPage() {
    const { signOut, user } = useAuth();
    const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
    const [nameChangeOpen, setNameChangeOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
            <div className="mx-auto max-w-lg">
                <Text variant="label" className="mb-2 block">
                    Settings
                </Text>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] font-normal text-[var(--color-text-primary)]">
                    Account
                </h1>
                <Text variant="bodyLg" className="mt-3 text-[var(--color-text-secondary)]">
                    Manage your <em>identity</em> — update your email, sign out, or permanently
                    close your account.
                </Text>

                {user?.email && (
                    <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
                        Signed in as{" "}
                        <span className="font-medium text-[var(--color-text-secondary)]">
                            {user.email}
                        </span>
                    </p>
                )}

                <Divider className="my-10" />

                {/* Actions */}
                <div className="divide-y divide-[var(--color-border-subtle)]">
                    <div className="flex items-start justify-between gap-6 py-5">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--color-text-primary)]">
                                Change name
                            </p>
                            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                                Update the name associated with your Schoolm8 account.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<User className="h-3.5 w-3.5" />}
                            onClick={() => setNameChangeOpen(true)}
                        >
                            Change
                        </Button>
                    </div>
                    {/* Change email */}
                    <div className="flex items-start justify-between gap-6 py-5">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--color-text-primary)]">
                                Change email
                            </p>
                            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                                Update the email address linked to your Schoolm8 account.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Mail className="h-3.5 w-3.5" />}
                        >
                            Change
                        </Button>
                    </div>

                    {/* Sign out */}
                    <div className="flex items-start justify-between gap-6 py-5">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--color-text-primary)]">Sign out</p>
                            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                                Sign out of this device. Your data will remain saved.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSignOutConfirmOpen(true)}
                            leftIcon={<LogOut className="h-3.5 w-3.5" />}
                        >
                            Sign out
                        </Button>
                    </div>

                    {/* Delete account */}
                    <div className="flex items-start justify-between gap-6 py-5">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--color-danger)]">Delete account</p>
                            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                                Permanently delete your account and all associated data. This cannot
                                be undone.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => (window.location.href = "/settings/account/delete")}
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sign out confirm */}
            <Modal
                open={signOutConfirmOpen}
                onClose={() => setSignOutConfirmOpen(false)}
                title="Sign out?"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setSignOutConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={signOut}>
                            Yes, sign out
                        </Button>
                    </>
                }
            >
                <Text variant="bodySm">
                    You'll be returned to the login screen. All your data stays saved in the cloud.
                </Text>
            </Modal>
            <Modal
                open={nameChangeOpen}
                onClose={() => setNameChangeOpen(false)}
                title="Change name"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setNameChangeOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={() => alert("Not implemented yet")}>
                            Save
                        </Button>
                    </>
                }
            >
                <TextInput placeholder="Your name" defaultValue={user?.displayName || ""} />
            </Modal>
        </div>
    );
}
