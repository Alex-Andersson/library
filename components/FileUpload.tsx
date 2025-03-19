"use client";

import { IKImage, ImageKitProvider, IKUpload, IKVideo } from "imagekitio-next";
import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Use environment variables directly for better consistency
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit/auth", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      signature: data.signature,
      expire: data.expire,
      token: data.token,
    };
  } catch (error) {
    console.error("Authentication request failed:", error);
    if (error instanceof Error) {
      throw new Error(`Authentication request failed: ${error.message}`);
    } else {
      throw new Error("Authentication request failed with an unknown error.");
    }
  }
};

interface Props {
  type: "image" | "video";
  accept: string;
  placeholder: string;
  folder: string;
  variant: "dark" | "light";
  onFileChange: (filePath: string) => void;
  value?: string;
}

const FileUpload = ({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
  value,
}: Props) => {
  const ikUploadRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ filePath: string | null }>({
    filePath: value ?? null,
  });
  const [progress, setProgress] = useState(0);

  const styles = {
    button: variant === "dark" ? "bg-dark-300" : "bg-light-600 border-gray-100 border",
    placeholder: variant === "dark" ? "text-light-100" : "text-slate-500",
    text: variant === "dark" ? "text-light-100" : "text-dark-400",
  };

  const onError = (error: any) => {
    console.error("Upload error:", error);
    toast.error(`${type} upload failed. Please try again.`);
  };

  const onSuccess = (res: any) => {
    console.log("Upload success response:", res);
    setFile(res);
    onFileChange(res.filePath);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
  };

  const onValidate = (file: File) => {
    if (type === "image" && file.size > 20 * 1024 * 1024) {
      toast.error("File size too large. Please upload an image smaller than 20MB.");
      return false;
    }
    if (type === "video" && file.size > 50 * 1024 * 1024) {
      toast.error("File size too large. Please upload a video smaller than 50MB.");
      return false;
    }
    return true;
  };

  return (
    <ImageKitProvider publicKey={publicKey} urlEndpoint={urlEndpoint} authenticator={authenticator}>
      <IKUpload
        ref={ikUploadRef}
        onError={onError}
        onSuccess={onSuccess}
        useUniqueFileName={true}
        validateFile={onValidate}
        onUploadStart={() => setProgress(0)}
        onUploadProgress={({ loaded, total }) => {
          setProgress(Math.round((loaded / total) * 100));
        }}
        folder={folder}
        accept={accept}
        className="hidden"
      />

      <button
        className={cn("upload-btn", styles.button)}
        onClick={(e) => {
          e.preventDefault();
          ikUploadRef.current?.click();
        }}
      >
        <Image src="/icons/upload.svg" alt="upload-icon" width={20} height={20} className="object-contain" />
        <p className={cn("text-base", styles.placeholder)}>{placeholder}</p>
        {file.filePath && <p className={cn("upload-filename", styles.text)}>{file.filePath}</p>}
      </button>

      {progress > 0 && progress !== 100 && (
        <div className="w-full rounded-full bg-green-200">
          <div className="progress" style={{ width: `${progress}%` }}>{progress}%</div>
        </div>
      )}

      {file.filePath &&
        (type === "image" ? (
          <IKImage alt={file.filePath} path={file.filePath} width={500} height={300} />
        ) : type === "video" ? (
          <IKVideo path={file.filePath} controls className="h-96 w-full rounded-xl" />
        ) : null)}
    </ImageKitProvider>
  );
};

export default FileUpload;
