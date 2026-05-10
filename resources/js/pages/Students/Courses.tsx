import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Users, 
  User,
  Calendar,
  Filter,
  X,
  CheckCircle,
  Plus,
  ChevronRight,
  GraduationCap,
  Hash,
  BarChart3,
  Star
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Courses',
    href: '/student/courses',
  },
];

interface Course {
  id: number;
  code: string;
  name: string;
  description: string;
  lecturer: string;
  schedule: string;
  room: string;
  capacity: number;
  enrolled: number;
  status: 'available' | 'enrolled' | 'full' | 'completed';
  category: string;
  semester: string;
  credits: number;
  rating?: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockCourses: Course[] = [
  { id: 1,  code: 'CS101', name: 'Introduction to Computer Science',     description: 'Fundamentals of programming, algorithms, and data structures.',                            lecturer: 'Dr. Ahmad Fauzi',    schedule: 'Mon & Wed 09:00-10:30', room: 'Lab A-201', capacity: 40,  enrolled: 35,  status: 'available', category: 'Computer Science',    semester: '2026 Semester 1', credits: 3, rating: 4.5 },
  { id: 2,  code: 'CS201', name: 'Data Structures & Algorithms',         description: 'Advanced study of data organization and algorithm design techniques.',                       lecturer: 'Prof. Sarah Chen',    schedule: 'Tue & Thu 11:00-12:30', room: 'Hall B-101', capacity: 35,  enrolled: 35,  status: 'full',      category: 'Computer Science',    semester: '2026 Semester 1', credits: 4, rating: 4.8 },
  { id: 3,  code: 'MATH202', name: 'Advanced Mathematics',               description: 'Linear algebra, calculus, and differential equations for engineers.',                      lecturer: 'Dr. Lisa Wong',       schedule: 'Mon & Wed 14:00-15:30', room: 'Room C-304', capacity: 50,  enrolled: 28,  status: 'available', category: 'Mathematics',         semester: '2026 Semester 1', credits: 3, rating: 4.2 },
  { id: 4,  code: 'PHY150', name: 'Physics Laboratory',                  description: 'Hands-on experiments in mechanics, optics, and electromagnetism.',                         lecturer: 'Prof. Michael Tan',   schedule: 'Fri 09:00-12:00',      room: 'Lab D-105', capacity: 25,  enrolled: 25,  status: 'full',      category: 'Physics',             semester: '2026 Semester 1', credits: 2, rating: 4.0 },
  { id: 5,  code: 'ENG101', name: 'English Literature',                  description: 'Study of classic and contemporary English literature with critical analysis.',             lecturer: 'Dr. Emily Roberts',   schedule: 'Tue & Thu 08:00-09:30', room: 'Hall A-101', capacity: 45,  enrolled: 20,  status: 'available', category: 'Literature',          semester: '2026 Semester 1', credits: 3, rating: 4.6 },
  { id: 6,  code: 'CS301', name: 'Artificial Intelligence',              description: 'Introduction to machine learning, neural networks, and intelligent systems.',              lecturer: 'Dr. Ahmad Fauzi',    schedule: 'Wed & Fri 15:00-16:30', room: 'Lab A-202', capacity: 30,  enrolled: 12,  status: 'available', category: 'Computer Science',    semester: '2026 Semester 2', credits: 4, rating: 4.9 },
  { id: 7,  code: 'DB200', name: 'Database Systems',                     description: 'Relational database design, SQL, normalization, and transaction management.',              lecturer: 'Prof. Sarah Chen',    schedule: 'Mon & Wed 11:00-12:30', room: 'Lab B-103', capacity: 35,  enrolled: 30,  status: 'available', category: 'Computer Science',    semester: '2026 Semester 2', credits: 3, rating: 4.3 },
  { id: 8,  code: 'NET101', name: 'Computer Networks',                   description: 'Fundamentals of networking, TCP/IP protocols, and network security.',                     lecturer: 'Dr. Raj Patel',       schedule: 'Tue & Thu 14:00-15:30', room: 'Room E-201', capacity: 40,  enrolled: 22,  status: 'available', category: 'Computer Science',    semester: '2026 Semester 2', credits: 3, rating: 4.1 },
  { id: 9,  code: 'MATH101', name: 'Basic Mathematics',                  description: 'Foundation mathematics covering algebra, geometry, and basic statistics.',                 lecturer: 'Dr. Lisa Wong',       schedule: 'Mon & Wed 08:00-09:30', room: 'Hall C-101', capacity: 60,  enrolled: 45,  status: 'available', category: 'Mathematics',         semester: '2026 Semester 1', credits: 3, rating: 3.9 },
  { id: 10, code: 'PHY200', name: 'Quantum Physics',                     description: 'Introduction to quantum mechanics, wave functions, and quantum computing basics.',         lecturer: 'Prof. Michael Tan',   schedule: 'Thu 14:00-17:00',      room: 'Lab D-200', capacity: 20,  enrolled: 18,  status: 'available', category: 'Physics',             semester: '2026 Semester 2', credits: 4, rating: 4.7 },
];

const categories = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Literature'];
const semesters = ['All', '2026 Semester 1', '2026 Semester 2'];

export default function StudentCourses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.lecturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSemester = selectedSemester === 'All' || course.semester === selectedSemester;
    const matchesStatus = selectedStatus === 'All' || course.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesSemester && matchesStatus;
  });

  const enrolledCourses = mockCourses.filter(c => c.status === 'enrolled');
  const availableCourses = filteredCourses.filter(c => c.status !== 'enrolled');

  const handleEnroll = (courseId: number) => {
    setEnrollingId(courseId);
    // Simulate API call
    setTimeout(() => {
      setEnrollingId(null);
      alert('Successfully enrolled in the course! (Demo)');
      // router.post(route('student.courses.enroll', courseId));
    }, 1000);
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Courses - Student Portal" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        
        .courses-root {
          font-family: 'DM Sans', sans-serif;
        }

        .course-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.15s;
          cursor: pointer;
        }

        .course-card:hover {
          border-color: #111827;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }

        .course-card.enrolled {
          border-color: #6EE7B7;
          background: #F9FEFB;
        }

        .course-card.full {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .course-card.full:hover {
          transform: none;
          border-color: #E5E7EB;
          box-shadow: none;
        }

        .filter-chip {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #6B7280;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .filter-chip.active {
          background: #111827;
          color: #FFFFFF;
          border-color: #111827;
        }

        .filter-chip:hover:not(.active) {
          border-color: #111827;
          color: #111827;
        }

        .stat-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px 20px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 560px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .enroll-btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          background: #111827;
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .enroll-btn:hover {
          opacity: 0.9;
        }

        .enroll-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .enroll-btn.enrolled {
          background: #D1FAE5;
          color: #065F46;
          cursor: default;
        }

        .enroll-btn.full {
          background: #F3F4F6;
          color: #9CA3AF;
          cursor: not-allowed;
        }

        .progress-bar {
          height: 6px;
          background: #E5E7EB;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #111827;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .progress-fill.full {
          background: #FCA5A5;
        }

        .progress-fill.enrolled {
          background: #6EE7B7;
        }
      `}</style>

      <div className="courses-root p-6 space-y-5">
        
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Course Catalog
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            Browse and enroll in available courses
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Available', value: mockCourses.filter(c => c.status === 'available').length, color: '#111827', icon: BookOpen },
            { label: 'Enrolled',  value: mockCourses.filter(c => c.status === 'enrolled').length,  color: '#059669', icon: CheckCircle },
            { label: 'Completed',  value: mockCourses.filter(c => c.status === 'completed').length,  color: '#2563EB', icon: GraduationCap },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 400, color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={18} color={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px' }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search courses by name, code, or lecturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  background: '#F9FAFB',
                  outline: 'none',
                }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '10px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#6B7280',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Filter size={14} />
              Filters
              {showFilters && <X size={14} />}
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 12 }}>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  background: '#F9FAFB',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  background: '#F9FAFB',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="All">All Status</option>
                <option value="available">Available</option>
                <option value="enrolled">Enrolled</option>
                <option value="full">Full</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        {/* Enrolled Courses Section */}
        {enrolledCourses.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              My Enrolled Courses
            </h2>
            <div className="grid gap-3">
              {enrolledCourses.map(course => (
                <div key={course.id} className="course-card enrolled" onClick={() => handleCourseClick(course)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={20} color="#065F46" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF' }}>{course.code}</span>
                          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{course.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6B7280' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            {course.schedule}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <User size={12} />
                            {course.lecturer}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#D1FAE5', color: '#065F46' }}>
                        <CheckCircle size={10} />
                        Enrolled
                      </span>
                      <ChevronRight size={16} color="#9CA3AF" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses Grid */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            {selectedCategory !== 'All' ? selectedCategory : 'All Available Courses'}
          </h2>
          
          {filteredCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
              <BookOpen size={48} color="#E5E7EB" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>No courses found</h3>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredCourses.map(course => (
                <div 
                  key={course.id} 
                  className={`course-card ${course.status === 'enrolled' ? 'enrolled' : ''} ${course.status === 'full' ? 'full' : ''}`}
                  onClick={() => course.status !== 'full' && handleCourseClick(course)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 10, 
                        background: course.status === 'full' ? '#FEE2E2' : '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <BookOpen size={18} color={course.status === 'full' ? '#FCA5A5' : '#6B7280'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#9CA3AF', background: '#F9FAFB', padding: '2px 6px', borderRadius: 4 }}>
                            {course.code}
                          </span>
                          {course.rating && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#F59E0B' }}>
                              <Star size={10} fill="#F59E0B" />
                              {course.rating}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                          {course.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                      <User size={12} />
                      <span>{course.lecturer}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                      <Clock size={12} />
                      <span>{course.schedule}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                      <Hash size={12} />
                      <span>Room {course.room} • {course.credits} credits</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                      <span>{course.enrolled} / {course.capacity} students</span>
                      <span>{Math.round((course.enrolled / course.capacity) * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${course.status === 'full' ? 'full' : course.status === 'enrolled' ? 'enrolled' : ''}`}
                        style={{ width: `${(course.enrolled / course.capacity) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Enroll Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (course.status === 'available') handleEnroll(course.id);
                    }}
                    disabled={course.status === 'full' || enrollingId === course.id}
                    className={`enroll-btn w-full justify-center ${course.status === 'enrolled' ? 'enrolled' : ''} ${course.status === 'full' ? 'full' : ''}`}
                  >
                    {enrollingId === course.id ? (
                      'Enrolling...'
                    ) : course.status === 'enrolled' ? (
                      <><CheckCircle size={14} /> Already Enrolled</>
                    ) : course.status === 'full' ? (
                      'Course Full'
                    ) : (
                      <><Plus size={14} /> Enroll Now</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Detail Modal */}
        {showModal && selectedCourse && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Course Details</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9CA3AF', background: '#F9FAFB', padding: '3px 8px', borderRadius: 4 }}>
                    {selectedCourse.code}
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginTop: 8, marginBottom: 8 }}>
                    {selectedCourse.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                    {selectedCourse.description}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Lecturer', value: selectedCourse.lecturer, icon: User },
                    { label: 'Schedule', value: selectedCourse.schedule, icon: Clock },
                    { label: 'Room', value: selectedCourse.room, icon: Hash },
                    { label: 'Credits', value: `${selectedCourse.credits} credits`, icon: Star },
                    { label: 'Semester', value: selectedCourse.semester, icon: Calendar },
                    { label: 'Category', value: selectedCourse.category, icon: BookOpen },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <item.icon size={14} color="#9CA3AF" />
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Capacity */}
                <div style={{ marginBottom: 20 }}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                    <span>Enrollment</span>
                    <span>{selectedCourse.enrolled} / {selectedCourse.capacity}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${selectedCourse.status === 'full' ? 'full' : ''}`} style={{ width: `${(selectedCourse.enrolled / selectedCourse.capacity) * 100}%` }} />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (selectedCourse.status === 'available') {
                      handleEnroll(selectedCourse.id);
                      setShowModal(false);
                    }
                  }}
                  disabled={selectedCourse.status === 'full' || selectedCourse.status === 'enrolled' || enrollingId === selectedCourse.id}
                  className={`enroll-btn w-full justify-center ${selectedCourse.status === 'enrolled' ? 'enrolled' : ''} ${selectedCourse.status === 'full' ? 'full' : ''}`}
                >
                  {enrollingId === selectedCourse.id ? (
                    'Enrolling...'
                  ) : selectedCourse.status === 'enrolled' ? (
                    <><CheckCircle size={14} /> Already Enrolled</>
                  ) : selectedCourse.status === 'full' ? (
                    'Course Full'
                  ) : (
                    <><Plus size={14} /> Enroll Now</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}