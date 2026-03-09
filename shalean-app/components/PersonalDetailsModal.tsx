"use client";

import React, { useState, useEffect } from "react";
import { User, X } from "lucide-react";
import { updateProfileForSession, uploadProfilePhoto } from "@/app/actions/profile";

export function PersonalDetailsModal({
  name: initialName,
  email,
  phone: initialPhone,
  address: initialAddress = "",
  avatar: initialAvatar = "",
  onClose,
  onSuccess,
}: {
  name: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo must be 2MB or smaller.");
      return;
    }
    setError(null);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let avatarUrl = initialAvatar;
      if (avatarFile) {
        const formData = new FormData();
        formData.set("avatar", avatarFile);
        const uploadRes = await uploadProfilePhoto(formData);
        if (!uploadRes.ok) {
          setError(uploadRes.error);
          setLoading(false);
          return;
        }
        avatarUrl = uploadRes.url;
      }
      const res = await updateProfileForSession({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        avatar: avatarUrl.trim() || undefined,
      });
      setLoading(false);
      if (res.ok) onSuccess();
      else setError(res.error);
    } catch {
      setLoading(false);
      setError("Something went wrong.");
    }
  };

  const currentAvatarUrl = avatarPreview ?? (initialAvatar || null);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-4 max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h3 className="text-base font-black text-slate-900">Personal Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 min-h-0">
          <div className="flex items-end gap-3 shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-block py-1.5 px-3 rounded-lg font-bold text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors">
                  {avatarFile ? "Change" : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-slate-600 mb-0.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>
          <div className="shrink-0">
            <label className="block text-xs font-bold text-slate-600 mb-0.5">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm"
            />
          </div>
          <div className="shrink-0">
            <label className="block text-xs font-bold text-slate-600 mb-0.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +27 82 123 4567"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <div className="shrink-0">
            <label className="block text-xs font-bold text-slate-600 mb-0.5">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, building, etc."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600 shrink-0">{error}</p>}
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-bold text-sm text-slate-600 bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
