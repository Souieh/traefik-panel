import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ManualCertificate {
  domain: string;
  cert_path: string;
  key_path: string;
}

interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  certificate?: ManualCertificate; // pass when editing
  onSaved: () => void;
}

export default function ManualCertificateModal({
  isOpen,
  onOpenChange,
  certificate,
  onSaved,
}: ModalProps) {
  const [domain, setDomain] = useState("");
  const [certificatePem, setCertificatePem] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (certificate) {
      setDomain(certificate.domain);
      // You may want to fetch actual PEM content if available
      setCertificatePem("");
      setPrivateKeyPem("");
    } else {
      setDomain("");
      setCertificatePem("");
      setPrivateKeyPem("");
    }
  }, [certificate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !certificatePem || !privateKeyPem) {
      toast.error("All fields are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/traefik/certificates/manual/${domain}`, {
        certificate_pem: certificatePem,
        private_key_pem: privateKeyPem,
      });
      toast.success("Certificate saved");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {certificate ? "Edit Certificate" : "Add Manual Certificate"}
          </DialogTitle>
          <DialogDescription>
            {certificate
              ? "Update the manual certificate for this domain."
              : "Provide the PEM certificate and private key for a domain."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          {/* Domain */}
          <div className="grid gap-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              required
              disabled={!!certificate} // lock domain when editing
            />
          </div>

          {/* Certificate PEM */}
          <div className="grid gap-2">
            <Label htmlFor="certificatePem">Certificate PEM (full chain)</Label>
            <Textarea
              id="certificatePem"
              value={certificatePem}
              onChange={(e) => setCertificatePem(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----..."
              rows={6}
              required
            />
          </div>

          {/* Private Key PEM */}
          <div className="grid gap-2">
            <Label htmlFor="privateKeyPem">Private Key PEM</Label>
            <Textarea
              id="privateKeyPem"
              value={privateKeyPem}
              onChange={(e) => setPrivateKeyPem(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----..."
              rows={6}
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {certificate ? "Update Certificate" : "Add Certificate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
