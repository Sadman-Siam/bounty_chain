import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Must match the contract's `enum Role { Arbiter, client, Freelancer }` order exactly —
// these are passed as raw uint8 values, so getting this wrong silently registers
// someone as the wrong role.
const ROLE_OPTIONS = [
  { label: "Arbiter", value: 0 },
  { label: "Client", value: 1 },
  { label: "Freelancer", value: 2 },
];

/**
 * Registration form for a not-yet-registered wallet.
 * Flow: pick avatar file -> upload to backend (Pinata) -> get CID ->
 * call contract.setUser(name, role, cid) -> wait for confirmation -> notify parent.
 */
export function RegisterForm({ contract, onRegistered }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[1].value); // default to Client
  const [avatarFile, setAvatarFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | confirming | error
  const [errorMessage, setErrorMessage] = useState(null);

  const isSubmitting = status === "uploading" || status === "confirming";

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }
    if (!avatarFile) {
      setErrorMessage("Please choose an avatar image.");
      return;
    }
    if (!contract) {
      setErrorMessage("Wallet not connected.");
      return;
    }

    try {
      // Step 1: upload the avatar to the backend, which pins it to Pinata.
      setStatus("uploading");
      const formData = new FormData();
      formData.append("file", avatarFile);

      const uploadRes = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error || "Avatar upload failed");
      }

      const { cid } = await uploadRes.json();

      // Step 2: register on-chain with the resulting CID.
      setStatus("confirming");
      const tx = await contract.setUser(name.trim(), role, cid);
      await tx.wait(); // wait for the transaction to be mined

      setStatus("idle");
      onRegistered?.();
    } catch (err) {
      console.error("Registration failed:", err);
      setErrorMessage(err.message || "Registration failed. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Register</h2>

      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          placeholder="Your display name"
        />
      </label>

      <label>
        Role
        <select
          value={role}
          onChange={(e) => setRole(Number(e.target.value))}
          disabled={isSubmitting}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Avatar
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
          disabled={isSubmitting}
        />
      </label>

      {errorMessage && <p style={{ color: "crimson" }}>{errorMessage}</p>}

      <button type="submit" disabled={isSubmitting}>
        {status === "uploading" && "Uploading avatar..."}
        {status === "confirming" && "Confirming transaction..."}
        {(status === "idle" || status === "error") && "Register"}
      </button>
    </form>
  );
}
