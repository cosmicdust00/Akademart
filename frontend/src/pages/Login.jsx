import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Calendar, 
  BookOpen, 
  Activity, 
  Check, 
  Plus, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle 
} from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Screen toggle: 'login' | 'register'
  const [authMode, setAuthMode] = useState("login");
  const [uiError, setUiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // LOGIN STATE
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // REGISTER MULTI-STEP WIZARD STATE
  const [regStep, setRegStep] = useState(1);
  const [regAccount, setRegAccount] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    angkatan: "2024",
  });
  const [regFakultas, setRegFakultas] = useState("");
  const [regJurusan, setRegJurusan] = useState("");
  
  // Courses tag builder
  const [courseInput, setCourseInput] = useState("");
  const [regCourses, setRegCourses] = useState([]);
  
  // Interest chips state
  const availableInterests = ["Coding", "Gaming", "Photography", "Design", "Robotics", "IoT", "Writing", "Public Speaking"];
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Hobbies chips state
  const availableHobbies = ["Musik", "Basket", "Sepakbola", "Membaca", "Catur", "Bulutangkis", "Traveling", "Anime"];
  const [selectedHobbies, setSelectedHobbies] = useState([]);

  const fakultasData = {
    "Fakultas Ilmu Komputer": ["Teknik Informatika", "Sistem Informasi", "Teknologi Informasi"],
    "Fakultas Teknik": ["Teknik Elektro", "Teknik Mesin", "Teknik Sipil", "Teknik Kimia"],
    "Fakultas Ekonomi & Bisnis": ["Manajemen", "Akuntansi", "Ekonomi Pembangunan"],
    "Fakultas Ilmu Sosial & Ilmu Politik": ["Ilmu Komunikasi", "Hubungan Internasional", "Administrasi Publik"],
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setUiError("Silakan isi semua kolom input login.");
      return;
    }
    setUiError("");
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate("/home");
    } catch (err) {
      setUiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Tag helpers for current courses
  const handleAddCourse = (e) => {
    e.preventDefault();
    if (courseInput.trim() && !regCourses.includes(courseInput.trim())) {
      setRegCourses([...regCourses, courseInput.trim()]);
      setCourseInput("");
    }
  };

  const handleRemoveCourse = (course) => {
    setRegCourses(regCourses.filter(c => c !== course));
  };

  // Toggle Interest & Hobby selections
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const toggleHobby = (hobby) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby));
    } else {
      setSelectedHobbies([...selectedHobbies, hobby]);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setUiError("");
    setIsLoading(true);

    const fullPayload = {
      ...regAccount,
      fakultas: regFakultas,
      jurusan: regJurusan,
      matakuliah: regCourses,
      interests: selectedInterests,
      hobbies: selectedHobbies,
    };

    try {
      await register(fullPayload);
      navigate("/home");
    } catch (err) {
      setUiError(err.message);
      setRegStep(1); // send back to start to review credentials if signup failed
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    // Validate Step 1
    if (regStep === 1) {
      const { username, full_name, email, password, angkatan } = regAccount;
      if (!username || !full_name || !email || !password || !angkatan) {
        setUiError("Mohon lengkapi semua kolom identitas dasar.");
        return;
      }
      if (!email.includes("@")) {
        setUiError("Format email tidak valid (harus menggunakan @).");
        return;
      }
    }
    // Validate Step 2
    if (regStep === 2) {
      if (!regFakultas || !regJurusan) {
        setUiError("Silakan pilih Fakultas dan Jurusan Anda.");
        return;
      }
    }

    setUiError("");
    setRegStep(regStep + 1);
  };

  const prevStep = () => {
    setUiError("");
    setRegStep(regStep - 1);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-950 px-4 py-16 overflow-hidden">
      {/* Background Glowing Blurs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-cyan-600/10 blur-[100px] animate-pulse-glow pointer-events-none"></div>

      <div className="w-full max-w-lg z-10">
        {/* Brand Banner Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 items-center justify-center shadow-lg shadow-violet-500/20 mb-3 animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">
            Akade<span className="text-violet-400 font-black">mart</span>
          </h1>
          <p className="text-sm text-slate-400 tracking-wide">
            Hyper-Local Campus E-Commerce & Graph Recommendations
          </p>
        </div>

        {/* Auth Error Display */}
        {uiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start space-x-3 text-rose-300 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{uiError}</span>
          </div>
        )}

        {/* MAIN PANEL */}
        <div className="glass-panel rounded-3xl shadow-2xl p-8 border border-white/10 glow-border">
          {/* LOGIN CONTAINER */}
          {authMode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-100">Selamat Datang Kembali</h2>
                <p className="text-xs text-slate-400">Silakan masuk menggunakan kredensial kampus Anda.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Username atau Email Kampus"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Kata Sandi"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all glow-button shadow-lg shadow-violet-500/25 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Masuk Ke Akun</span>
                )}
              </button>

              <div className="text-center pt-4 border-t border-white/5">
                <p className="text-xs text-slate-400">
                  Belum punya akun Akademart?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setRegStep(1);
                      setUiError("");
                    }}
                    className="text-violet-400 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* REGISTER STEP WIZARD CONTAINER */}
          {authMode === "register" && (
            <div className="space-y-6">
              {/* Wizard Status Banner */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">Buat Akun Baru</h2>
                  <p className="text-xs text-slate-400">Langkah {regStep} dari 4: Profiling Kampus</p>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-5 h-1.5 rounded-full transition-all duration-300 ${
                        step <= regStep ? "bg-violet-500 shadow-md shadow-violet-500/50" : "bg-white/10"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* STEP 1: ACCOUNT DETAILS */}
              {regStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Identitas Dasar</h3>
                    <p className="text-[11px] text-slate-400">Masukkan nama pengguna dan sandi unik Anda.</p>
                  </div>

                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Username (contoh: budi.informatika)"
                      value={regAccount.username}
                      onChange={(e) => setRegAccount({ ...regAccount, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                    />
                  </div>

                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={regAccount.full_name}
                      onChange={(e) => setRegAccount({ ...regAccount, full_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      placeholder="Email Kampus (@kampus.ac.id)"
                      value={regAccount.email}
                      onChange={(e) => setRegAccount({ ...regAccount, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                      <input
                        type="password"
                        placeholder="Kata Sandi"
                        value={regAccount.password}
                        onChange={(e) => setRegAccount({ ...regAccount, password: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                      />
                    </div>

                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                      <select
                        value={regAccount.angkatan}
                        onChange={(e) => setRegAccount({ ...regAccount, angkatan: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm appearance-none cursor-pointer"
                      >
                        <option value="2024">Angkatan 2024</option>
                        <option value="2023">Angkatan 2023</option>
                        <option value="2022">Angkatan 2022</option>
                        <option value="2021">Angkatan 2021</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CAMPUS AFFILIATION */}
              {regStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Afiliasi Fakultas</h3>
                    <p className="text-[11px] text-slate-400">Pilih identitas akademik tempat Anda bernaung saat ini.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-xs text-slate-400 mb-1.5 font-medium">Pilih Fakultas</label>
                      <select
                        value={regFakultas}
                        onChange={(e) => {
                          setRegFakultas(e.target.value);
                          setRegJurusan("");
                        }}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm appearance-none cursor-pointer"
                      >
                        <option value="">-- Pilih Fakultas --</option>
                        {Object.keys(fakultasData).map((fak) => (
                          <option key={fak} value={fak}>{fak}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-slate-400 mb-1.5 font-medium">Pilih Jurusan</label>
                      <select
                        value={regJurusan}
                        onChange={(e) => setRegJurusan(e.target.value)}
                        disabled={!regFakultas}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <option value="">-- Pilih Jurusan --</option>
                        {regFakultas &&
                          fakultasData[regFakultas].map((jur) => (
                            <option key={jur} value={jur}>{jur}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ACADEMIC CONTEXT (COURSES BUILDER) */}
              {regStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Mata Kuliah Semester Ini</h3>
                    <p className="text-[11px] text-slate-400">
                      Mesin rekomendasi graph kami akan memetakan barang-barang relevan yang dibeli oleh mahasiswa lain di mata kuliah yang sama!
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <BookOpen className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Ketik mata kuliah, tekan enter/klik (+)"
                          value={courseInput}
                          onChange={(e) => setCourseInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddCourse(e)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={handleAddCourse}
                        className="px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-violet-500/10"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Tag display panel */}
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 min-h-[100px] flex flex-wrap gap-2 items-start">
                      {regCourses.length === 0 ? (
                        <p className="text-xs text-slate-500 italic m-auto">Belum ada mata kuliah yang ditambahkan. Ketik dan tambahkan di atas!</p>
                      ) : (
                        regCourses.map((course) => (
                          <span
                            key={course}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25 animate-scaleIn"
                          >
                            <span>{course}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCourse(course)}
                              className="p-0.5 text-violet-400 hover:text-rose-400 rounded transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: INTERESTS & HOBBIES CHIPS */}
              {regStep === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Minat & Hobi Terkait</h3>
                    <p className="text-[11px] text-slate-400">
                      Bantu kami menemukan peer seller yang memiliki ketertarikan sejenis dengan Anda untuk transaksi COD yang menyenangkan!
                    </p>
                  </div>

                  {/* Interests selectors */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Ketertarikan / Minat</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableInterests.map((interest) => {
                        const selected = selectedInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                              selected
                                ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20"
                                : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hobbies selectors */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                      <Activity className="w-4 h-4 text-violet-400" />
                      <span>Hobi & Aktivitas</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableHobbies.map((hobby) => {
                        const selected = selectedHobbies.includes(hobby);
                        return (
                          <button
                            key={hobby}
                            type="button"
                            onClick={() => toggleHobby(hobby)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                              selected
                                ? "bg-violet-500 text-white font-bold border-violet-400 shadow-md shadow-violet-500/20"
                                : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            {hobby}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION WIZARD BUTTONS */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                {regStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setUiError("");
                    }}
                    className="text-xs text-slate-400 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Sudah punya akun? Masuk
                  </button>
                )}

                {regStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-500/10 text-xs font-semibold ml-auto cursor-pointer"
                  >
                    <span>Lanjutkan</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegisterSubmit}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-violet-500/20 text-xs ml-auto disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Selesaikan Pendaftaran</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
