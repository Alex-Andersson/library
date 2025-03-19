"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { borrowBook } from "@/lib/actions/book";

interface Props {
  userId: string;
  bookId: string;
  borrowingEligibility: {
    isEligible: boolean;
    message: string;
  };
}

const BorrowBook = ({
  userId,
  bookId,
  borrowingEligibility: { isEligible, message },
}: Props) => {
  const router = useRouter();
  const [borrowing, setBorrowing] = useState(false);

  const handleBorrowBook = async () => {
    if (!isEligible) {
      toast("Error");
    }

    setBorrowing(true);

    try {
      const result = await borrowBook({ bookId, userId });

      if (result.success) {
        toast("Book borrowed successfully", {
          style: {
            background: "green",
            color: "white", // Make text visible on red background
          },
        });

        router.push("/");
      } else {
        toast("Book borrowed successfully", {
          style: {
            background: "red",
            color: "white", // Make text visible on red background
          },
        });
      }
    } catch (error) {
      toast("Book borrowed successfully", {
        style: {
          background: "red",
          color: "white", // Make text visible on red background
        },
      });
    } finally {
      setBorrowing(false);
    }
  };

  return (
    <Button
      className="book-overview_btn"
      onClick={handleBorrowBook}
      disabled={borrowing}
    >
      <Image src="/icons/book.svg" alt="book" width={20} height={20} />
      <p className="font-bebas-neue text-xl text-dark-100">
        {borrowing ? "Borrowing ..." : "Borrow Book"}
      </p>
    </Button>
  );
};
export default BorrowBook;
