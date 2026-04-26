import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Monitor,
  QrCode,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Manajemen Aset Digital",
    description: "Catat dan lacak semua aset laboratorium dengan QR Code unik untuk setiap item",
    icon: Monitor,
  },
  {
    title: "Peminjaman Mudah",
    description: "Sistem peminjaman dengan QR scan, pantau status dan history aset kapan saja",
    icon: Boxes,
  },
  {
    title: "Dashboard Real-time",
    description: "Visualisasi data aset dengan grafik interaktif dan statistik terkini",
    icon: BarChart3,
  },
  {
    title: "Laporan Lengkap",
    description: "Generate laporan aset, penyusutan, dan maintenance dalam hitungan detik",
    icon: QrCode,
  },
  {
    title: "Multi-User & Role",
    description: "Kelola akses dengan role admin dan user dengan audit trail lengkap",
    icon: Users,
  },
  {
    title: "Keamanan Data",
    description: "Data terenkripsi dengan backup otomatis dan tracking perubahan",
    icon: Shield,
  },
];

const stats = [
  { label: "Total Aset", value: "10,000+" },
  { label: "Skolah Terintegrasi", value: "500+" },
  { label: "Peminjaman/Bulan", value: "50,000+" },
  { label: "Uptime", value: "99.9%" },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">LabAsset</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/sign-in">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link to="/sign-up">
              <Button size="sm">Daftar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Sistem Manajemen Aset Sekolah Modern
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Kelola Aset{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Laboratorium
                </span>{" "}
                dengan Mudah
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Solusi lengkap untuk mengelola inventaris laboratorium komputer sekolah.
                Dengan QR code, peminjaman digital, dan laporan otomatis.
              </p>
              <div className="flex gap-4">
                <Link to="/sign-up">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Mulai Gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/public/asset/$id" params={{ id: "1" }}>
                  <Button variant="outline" size="lg">
                    Lihat Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl transform rotate-3" />
              <Card className="relative bg-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                      <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Monitor className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Acer Veriton M4650</p>
                        <p className="text-sm text-muted-foreground font-mono">PCD26042601001</p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                          Tersedia
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">128</p>
                        <p className="text-sm text-muted-foreground">Total Aset</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-xl">
                        <p className="text-2xl font-bold text-green-600">95</p>
                        <p className="text-sm text-muted-foreground">Tersedia</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-xl">
                        <p className="text-2xl font-bold text-orange-600">23</p>
                        <p className="text-sm text-muted-foreground">Dipinjam</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Fitur Lengkap untuk Sekolah Modern
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola aset laboratorium dalam satu platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-blue-100"
              >
                <CardContent className="p-8">
                  <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                    <feature.icon className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold tracking-tight mb-6">
            Siap Modernisasi Manajemen Aset Sekolah?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabung dengan ratusan sekolah yang sudah menggunakan LabAsset
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Daftar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/public/asset/$id" params={{ id: "1" }}>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/10"
              >
                Lihat Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Boxes className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">LabAsset Manager</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 LabAsset. Sistem Manajemen Aset untuk Sekolah Indonesia.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm">Data aman & terenkripsi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
