import { cleanup, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Label,
  Progress,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../src/index.js";

afterEach(() => {
  cleanup();
});

describe("cn()", () => {
  it("merges conflicting Tailwind classes with last wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false, "text-lg")).toBe("text-lg");
  });
});

describe("Button", () => {
  it("renders default, outline, and ghost variants without throwing", () => {
    const { rerender } = render(<Button>Default</Button>);
    expect(screen.getByRole("button", { name: "Default" })).toBeTruthy();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" })).toBeTruthy();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button", { name: "Ghost" })).toBeTruthy();
  });
});

describe("Card", () => {
  it("renders children inside CardHeader/CardContent structure", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Lead score</CardTitle>
        </CardHeader>
        <CardContent>Content body</CardContent>
      </Card>
    );

    expect(screen.getByText("Lead score")).toBeTruthy();
    expect(screen.getByText("Content body")).toBeTruthy();
  });
});

describe("Badge", () => {
  it("renders critical variant with destructive semantic styling", () => {
    render(<Badge variant="critical">Crítico</Badge>);

    const badge = screen.getByText("Crítico");
    expect(badge.className).toContain("text-destructive");
    expect(badge.className).toContain("bg-destructive/15");
    expect(badge.className).not.toContain("bg-red-100");
  });

  it("renders score band variants", () => {
    const { rerender } = render(<Badge variant="low">Baixo</Badge>);
    expect(screen.getByText("Baixo").className).toContain("text-warning");

    rerender(<Badge variant="medium">Médio</Badge>);
    expect(screen.getByText("Médio").className).toContain("text-muted-foreground");

    rerender(<Badge variant="excellent">Excelente</Badge>);
    expect(screen.getByText("Excelente").className).toContain("text-success");
  });
});

describe("Input with Form", () => {
  function SearchField() {
    const form = useForm<{ query: string }>({ defaultValues: { query: "" } });

    return (
      <Form {...form}>
        <form>
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buscar</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da empresa" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  }

  it("renders with accessible label association", () => {
    render(<SearchField />);

    const input = screen.getByLabelText("Buscar");
    expect(input).toBeTruthy();
    expect(input.getAttribute("placeholder")).toBe("Nome da empresa");
  });
});

describe("@leadforge/ui barrel exports", () => {
  it("imports and renders key primitives in jsdom", () => {
    render(
      <TooltipProvider>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" />
          <Checkbox aria-label="Accept terms" />
          <Progress value={40} />
          <Separator />
          <Skeleton className="h-4 w-20" />
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>System update available.</AlertDescription>
          </Alert>
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Tab A</TabsTrigger>
            </TabsList>
            <TabsContent value="a">Panel A</TabsContent>
          </Tabs>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Acme</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <ScrollArea className="h-8">
            <div>Scrollable</div>
          </ScrollArea>
          <Dialog>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
              <DialogTitle>Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger>Open sheet</SheetTrigger>
            <SheetContent>
              <SheetTitle>Sheet</SheetTitle>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select>
            <SelectTrigger aria-label="Status">
              <SelectValue placeholder="Pick" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger>Tip</TooltipTrigger>
            <TooltipContent>Hint</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );

    expect(screen.getByLabelText("Notes")).toBeTruthy();
    expect(screen.getByLabelText("Accept terms")).toBeTruthy();
    expect(screen.getByText("Heads up")).toBeTruthy();
    expect(screen.getByText("Acme")).toBeTruthy();
  });
});
