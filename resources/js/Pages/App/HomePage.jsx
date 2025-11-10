import React, { useState, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useForm, usePage, router, Link } from "@inertiajs/react";
import {
    Check,
    Trash2,
    Upload,
    Edit,
    ArrowLeft,
    Search,
    X,
} from "lucide-react"; // <-- PERBAIKAN: Menambahkan 'from "lucide-react";'
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import Chart from "react-apexcharts";

// Pastikan file ini sudah Anda buat di resources/js/Components/TrixEditor.jsx
import TrixEditor from "@/Components/TrixEditor";

// Komponen untuk satu item Todo
function TodoItem({ todo }) {
    // State untuk mengontrol mode edit judul/deskripsi
    const [isEditing, setIsEditing] = useState(false);
    // State untuk mengontrol mode detail/cover (Tampilan Awal vs Tampilan Detail)
    const [isExpanded, setIsExpanded] = useState(false);

    // Form untuk update judul dan deskripsi
    // Menggunakan PATCH asli karena tidak ada file upload (Trix menangani file di form ini sebagai HTML)
    const {
        data: editData,
        setData: setEditData,
        patch: patchTodo,
        processing: processingEdit,
        errors: editErrors,
        reset: resetEditForm,
    } = useForm({
        title: todo.title,
        description: todo.description || "", // Pastikan nilai awal tidak null
    });

    // Form untuk update cover
    const {
        data: coverData,
        setData: setCoverData,
        post: postCover,
        processing: processingCover,
        errors: coverErrors,
        reset: resetCoverForm,
    } = useForm({
        cover: null,
    });

    // --- Helper Handlers ---
    const stopPropagation = (e) => e.stopPropagation();

    // Fungsi utilitas untuk membersihkan HTML dan membuat snippet
    const getSnippet = (htmlString) => {
        if (!htmlString || htmlString.trim() === "") {
            return "Tidak ada deskripsi.";
        }
        // 1. Hilangkan semua tag HTML (termasuk tag <p>)
        const plainText = htmlString.replace(/<[^>]*>?/gm, "");
        // 2. Jika setelah dibersihkan teksnya kosong (misal hanya berisi <img>), kembalikan default
        if (plainText.trim() === "") {
            return "(Deskripsi hanya berisi gambar/media.)";
        }
        // 3. Potong 100 karakter pertama
        return (
            plainText.substring(0, 100) + (plainText.length > 100 ? "..." : "")
        );
    };

    // --- Handlers Aksi ---
    const handleToggleFinished = (e) => {
        stopPropagation(e);
        router.patch(
            `/todos/${todo.id}`,
            {
                is_finished: !todo.is_finished,
            },
            { preserveScroll: true }
        );
    };

    const handleDelete = (e) => {
        stopPropagation(e);

        Swal.fire({
            title: "Anda yakin?",
            text: "Todo yang sudah dihapus tidak dapat dikembalikan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/todos/${todo.id}`, {
                    onSuccess: () => {
                        Swal.fire({
                            title: "Berhasil!",
                            text: "Todo telah dihapus.",
                            icon: "success",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    const handleCoverSubmit = (e) => {
        e.preventDefault();
        postCover(`/todos/${todo.id}/cover`, {
            preserveScroll: true,
            onSuccess: () => {
                resetCoverForm("cover");
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Cover berhasil diupdate!",
                    showConfirmButton: false,
                    timer: 3000,
                });
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        stopPropagation(e);

        // Menggunakan patchTodo (PATCH) karena tidak ada file upload terpisah
        patchTodo(`/todos/${todo.id}`, {
            onSuccess: () => {
                setIsEditing(false);
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Todo berhasil diupdate!",
                    showConfirmButton: false,
                    timer: 3000,
                });
            },
            preserveScroll: true,
        });
    };

    const handleCancelEdit = (e) => {
        stopPropagation(e);
        setIsEditing(false);
        resetEditForm();
    };

    const handleEditClick = (e) => {
        stopPropagation(e);
        setIsEditing(true);
    };

    // --- TAMPILAN DETAIL (SAAT isExpanded = true) ---
    if (isExpanded) {
        return (
            <Card className={cn(todo.is_finished ? "bg-muted/50" : "")}>
                <CardHeader>
                    <CardTitle>{todo.title}</CardTitle>
                    <CardDescription>Detail Sampul</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Tampilan Cover */}
                    {todo.cover ? (
                        <img
                            src={`/storage/${todo.cover}`}
                            alt="Todo Cover"
                            className="mb-4 h-48 w-full rounded-md object-cover"
                        />
                    ) : (
                        <div className="mb-4 flex h-48 w-full items-center justify-center rounded-md border border-dashed text-muted-foreground">
                            Belum ada sampul.
                        </div>
                    )}
                    {/* Form Update Cover */}
                    <form onSubmit={handleCoverSubmit} className="flex gap-2">
                        <Input
                            type="file"
                            onChange={(e) =>
                                setCoverData("cover", e.target.files[0])
                            }
                        />
                        <Button
                            type="submit"
                            size="icon"
                            variant="outline"
                            disabled={processingCover}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                    </form>
                    {coverErrors.cover && (
                        <div className="mt-1 text-sm text-red-600">
                            {coverErrors.cover}
                        </div>
                    )}
                </CardContent>

                {/* TAMPILAN RICH TEXT DESKRIPSI (HTML) */}
                {todo.description && (
                    <CardContent className="pt-0">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Deskripsi Lengkap
                        </h3>
                        <div
                            className="trix-content prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: todo.description,
                            }}
                        />
                    </CardContent>
                )}

                <CardFooter className="flex justify-start">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded(false)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // --- TAMPILAN RINGKAS (SAAT isExpanded = false) ---
    return (
        <Card
            className={cn("py-0", todo.is_finished ? "bg-muted/50" : "")}
            onClick={() => {
                if (!isEditing) {
                    setIsExpanded(true);
                }
            }}
        >
            <div
                className={cn(
                    "flex items-center justify-between px-6 py-4",
                    !isEditing &&
                        "cursor-pointer transition-colors hover:bg-accent/50"
                )}
            >
                {isEditing ? (
                    // Form Edit Judul & Deskripsi
                    <form
                        onSubmit={handleEditSubmit}
                        className="w-full space-y-2"
                        onClick={stopPropagation}
                    >
                        <Input
                            type="text"
                            value={editData.title}
                            onChange={(e) =>
                                setEditData("title", e.target.value)
                            }
                            className="text-lg font-semibold"
                            placeholder="Judul Todo"
                        />
                        {editErrors.title && (
                            <div className="text-sm text-red-600">
                                {editErrors.title}
                            </div>
                        )}

                        {/* INPUT DESKRIPSI: TrixEditor */}
                        <TrixEditor
                            name={`description-edit-${todo.id}`}
                            value={editData.description || ""}
                            onChange={(html) =>
                                setEditData("description", html)
                            }
                            placeholder="Deskripsi Todo (Rich Text)"
                        />
                        {editErrors.description && (
                            <div className="text-sm text-red-600">
                                {editErrors.description}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelEdit}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processingEdit}>
                                {processingEdit ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    // Tampilan Teks Judul & Deskripsi (Snippet)
                    <>
                        <div
                            className="flex-1"
                            onClick={(e) => isEditing && stopPropagation(e)}
                        >
                            <CardTitle
                                className={
                                    todo.is_finished ? "line-through" : ""
                                }
                            >
                                {todo.title}
                            </CardTitle>
                            <CardDescription
                                className={
                                    todo.is_finished ? "line-through" : ""
                                }
                            >
                                {/* PERBAIKAN SNIPPET DENGAN FUNGSI getSnippet() */}
                                {getSnippet(todo.description)}
                            </CardDescription>
                        </div>

                        {/* Bagian Kanan: Tombol Aksi */}
                        <div
                            className="flex shrink-0 items-center gap-2 pl-4"
                            onClick={stopPropagation}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleEditClick}
                                title="Edit Judul & Deskripsi"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={
                                    todo.is_finished ? "default" : "outline"
                                }
                                size="sm"
                                onClick={handleToggleFinished}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                {todo.is_finished
                                    ? "Selesai"
                                    : "Tandai Selesai"}
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
}

// Komponen untuk Filter dan Pencarian
function FilterControls({ filters }) {
    // State untuk 'search' (text input)
    const [search, setSearch] = useState(filters.search || "");
    // State untuk 'filter' (tombol aktif)
    const [filter, setFilter] = useState(filters.filter || "all");

    // Kirim request ke server saat state berubah
    useEffect(() => {
        const data = {};
        if (search) data.search = search;
        if (filter !== "all") data.filter = filter;

        router.get(window.location.pathname, data, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    }, [search, filter]);

    return (
        <Card className="mb-8 py-0">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                {/* Input Pencarian */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Cari berdasarkan judul atau deskripsi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {/* Tombol Filter Status */}
                <div className="flex shrink-0 gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        onClick={() => setFilter("all")}
                        className="flex-1"
                    >
                        Semua
                    </Button>
                    <Button
                        variant={
                            filter === "unfinished" ? "default" : "outline"
                        }
                        onClick={() => setFilter("unfinished")}
                        className="flex-1"
                    >
                        Belum Selesai
                    </Button>
                    <Button
                        variant={filter === "finished" ? "default" : "outline"}
                        onClick={() => setFilter("finished")}
                        className="flex-1"
                    >
                        Selesai
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Komponen untuk Statistik (ApexCharts) ---
function TodoStats({ stats }) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const { total, finished, unfinished } = stats;

    const chartSeries = [finished, unfinished];
    const chartOptions = {
        chart: {
            type: "donut",
        },
        labels: ["Selesai", "Belum Selesai"],
        colors: ["#22c55e", "#ef4444"],
        legend: {
            position: "bottom",
            labels: {
                colors: "hsl(var(--foreground))",
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: "Total",
                            formatter: () => total,
                        },
                    },
                },
            },
        },
        dataLabels: {
            enabled: true,
            style: {
                colors: ["#fff", "#fff"],
            },
            dropShadow: {
                enabled: false,
            },
            formatter: (val, opts) => {
                return opts.w.globals.series[opts.seriesIndex];
            },
        },
    };

    return (
        <Card className="mb-8 py-0">
            <CardHeader className="p-4 pb-4">
                <CardTitle>Statistik Pekerjaan</CardTitle>
                <CardDescription>
                    Statistik keseluruhan dari semua pekerjaan Anda.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-4 pt-0 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Pekerjaan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-2xl font-bold">{total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Selesai
                        </CardTitle>
                        <Check className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-2xl font-bold">{finished}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Belum Selesai
                        </CardTitle>
                        <X className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-2xl font-bold">{unfinished}</div>
                    </CardContent>
                </Card>
            </CardContent>

            {/* Area Chart */}
            {isClient && (
                <CardFooter className="p-4 pt-0">
                    {total > 0 ? (
                        <div className="w-full">
                            <Chart
                                options={chartOptions}
                                series={chartSeries}
                                type="donut"
                                width="100%"
                            />
                        </div>
                    ) : (
                        <div className="w-full py-10 text-center text-muted-foreground">
                            Belum ada data untuk ditampilkan di chart.
                        </div>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}

// Komponen Halaman Utama
export default function HomePage() {
    // Ambil semua props
    const { auth, todos, filters, stats } = usePage().props;

    // Form untuk tambah todo baru
    const { data, setData, post, processing, errors, reset } = useForm({
        title: "",
        description: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/todos", {
            onSuccess: () => {
                reset();
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Todo baru berhasil ditambahkan!",
                    showConfirmButton: false,
                    timer: 3000,
                });
            },
            onError: (errors) => {
                if (errors.title || errors.description) {
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "error",
                        title: "Periksa kembali form Anda.",
                        showConfirmButton: false,
                        timer: 3000,
                    });
                }
            },
        });
    };

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-4xl">
                    {/* Hero Section */}
                    <div className="mb-12 text-center">
                        <h1 className="mb-4 text-4xl font-bold">
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: "&#128075;",
                                }}
                            />
                            Hai! {auth.name}
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Ini adalah daftar pekerjaanmu.
                        </p>
                    </div>

                    {/* Form Tambah Todo */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Tambah Pekerjaan Baru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="title">
                                            Judul
                                        </FieldLabel>
                                        <Input
                                            id="title"
                                            type="text"
                                            placeholder="Apa yang ingin kamu kerjakan?"
                                            value={data.title}
                                            onChange={(e) =>
                                                setData("title", e.target.value)
                                            }
                                        />
                                        {errors.title && (
                                            <div className="text-sm text-red-600">
                                                {errors.title}
                                            </div>
                                        )}
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="description">
                                            Deskripsi (Opsional)
                                        </FieldLabel>
                                        {/* GANTI INPUT INI dengan TrixEditor */}
                                        <TrixEditor
                                            name="description-add"
                                            value={data.description}
                                            onChange={(html) =>
                                                setData("description", html)
                                            }
                                            placeholder="Tambahkan detail (Rich Text)..."
                                        />
                                        {errors.description && (
                                            <div className="text-sm text-red-600">
                                                {errors.description}
                                            </div>
                                        )}
                                    </Field>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing ? "Menyimpan..." : "Tambah"}
                                    </Button>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Statistik */}
                    <TodoStats stats={stats} />

                    {/* FilterControls */}
                    <FilterControls filters={filters} />

                    {/* Daftar Todos */}
                    <div className="space-y-4">
                        {todos.data.length > 0 ? (
                            todos.data.map((todo) => (
                                <TodoItem key={todo.id} todo={todo} />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">
                                {filters.search || filters.filter
                                    ? "Todo tidak ditemukan."
                                    : "Belum ada pekerjaan."}
                            </p>
                        )}
                    </div>

                    {/* Paginasi */}
                    {todos.links.length > 3 && (
                        <div className="mt-8 flex justify-center space-x-1">
                            {todos.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    preserveScroll
                                    className={cn(
                                        "inline-block rounded-md px-3 py-2 text-sm",
                                        link.active
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card hover:bg-accent",
                                        !link.url
                                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                                            : "border"
                                    )}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    onClick={(e) =>
                                        !link.url && e.preventDefault()
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
