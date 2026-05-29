// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

describe("Dialog", () => {
  it("renders trigger and opens content", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>My Dialog</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await userEvent.click(screen.getByText("Open"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("My Dialog")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
  })

  it("closes when close button is clicked", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Dialog</DialogTitle>
          <DialogClose>X</DialogClose>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await userEvent.click(screen.getByText("X"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})

describe("AlertDialog", () => {
  it("renders trigger and opens content", async () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction>Confirm</AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    )
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    await userEvent.click(screen.getByText("Delete"))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByText("Are you sure?")).toBeInTheDocument()
  })

  it("closes on cancel", async () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm?</AlertDialogTitle>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    )
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    await userEvent.click(screen.getByText("Cancel"))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
})

describe("Sheet", () => {
  it("renders content when open", () => {
    render(
      <Sheet open onOpenChange={() => {}}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>,
    )
    expect(screen.getByText("Sheet Title")).toBeInTheDocument()
    expect(screen.getByText("Sheet description")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent>
          <SheetTitle>Hidden</SheetTitle>
        </SheetContent>
      </Sheet>,
    )
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument()
  })
})
