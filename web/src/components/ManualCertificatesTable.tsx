import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

interface ManualCertificate {
  domain: string;
  cert_path: string;
  key_path: string;
}

interface Props {
  certificates: ManualCertificate[];
  onEdit: (cert: ManualCertificate) => void;
  onDelete: (cert: ManualCertificate) => void;
  isLoading?: boolean;
}

export default function ManualCertificatesTable({
  certificates,
  onEdit,
  onDelete,
  isLoading,
}: Props) {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Certificate Path</TableHead>
            <TableHead>Key Path</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.map((cert) => (
            <TableRow key={cert.domain}>
              <TableCell className="font-medium">{cert.domain}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="truncate max-w-xs">
                  {cert.cert_path}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="truncate max-w-xs">
                  {cert.key_path}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(cert)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(cert)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {!certificates.length && !isLoading && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No manual certificates found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
