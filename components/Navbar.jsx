'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';

const navLinks = [
  {
    name: 'Home',
    href: '#home',
  },
  {
    name: 'Services',
    href: '#services',
  },
  {
    name: 'How It Works',
    href: '#how-it-works',
  },
  {
    name: 'Roles',
    href: '#roles',
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header
      className={`
        fixed left-0 top-0 z-50 w-full
        transition-all duration-300
        ${
          scrolled
            ? 'border-b border-white/10 bg-slate-950/90 shadow-xl shadow-black/10 backdrop-blur-xl'
            : 'bg-slate-950/70 backdrop-blur-md'
        }
      `}
    >
      <div className="mx-auto flex h-[78px] w-full max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-12">

        {/* =====================================================
            LOGO
        ====================================================== */}
        <Link
          href="/"
          className="group flex items-center gap-3"
          onClick={handleLinkClick}
        >
          <div
            className="
              flex h-11 w-11 items-center justify-center
              rounded-2xl
              bg-gradient-to-br from-teal-400 to-cyan-500
              shadow-lg shadow-teal-500/20
              transition-transform duration-300
              group-hover:scale-105
            "
          >
            <span className="text-xl font-black text-slate-950">
              +
            </span>
          </div>

          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight text-white">
              Where Is My
              <span className="ml-1 text-teal-400">
                Doctor
              </span>
            </p>

            <p className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:block">
              Healthcare at your doorstep
            </p>
          </div>
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ====================================================== */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="
                rounded-xl
                px-4 py-2.5
                text-sm font-medium
                text-slate-300
                transition-all duration-200
                hover:bg-white/5
                hover:text-teal-300
              "
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* =====================================================
            DESKTOP AUTH BUTTONS
        ====================================================== */}
        <div className="hidden items-center gap-3 lg:flex">

          {/* Login */}
          <Link
            href="/login"
            className="
              group
              inline-flex items-center gap-2
              rounded-xl
              border border-white/15
              bg-white/[0.04]
              px-5 py-2.5
              text-sm font-semibold
              text-white
              transition-all duration-300
              hover:border-teal-400/50
              hover:bg-teal-400/10
              hover:text-teal-300
            "
          >
            <LogIn
              size={17}
              className="
                transition-transform duration-300
                group-hover:translate-x-0.5
              "
            />

            Login
          </Link>

          {/* Register */}
          <Link
            href="/register"
            className="
              group
              inline-flex items-center gap-2
              rounded-xl
              bg-gradient-to-r
              from-teal-400
              to-cyan-400
              px-5 py-2.5
              text-sm font-bold
              text-slate-950
              shadow-lg shadow-teal-500/20
              transition-all duration-300
              hover:-translate-y-0.5
              hover:shadow-xl
              hover:shadow-teal-500/25
            "
          >
            <UserPlus
              size={17}
              className="
                transition-transform duration-300
                group-hover:scale-110
              "
            />

            Register
          </Link>
        </div>

        {/* =====================================================
            MOBILE MENU BUTTON
        ====================================================== */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="
            flex h-11 w-11 items-center justify-center
            rounded-xl
            border border-white/10
            bg-white/5
            text-white
            transition
            hover:bg-white/10
            lg:hidden
          "
          aria-label="Toggle navigation"
        >
          {open ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </div>

      {/* =======================================================
          MOBILE MENU
      ======================================================== */}
      <div
        className={`
          overflow-hidden
          border-t border-white/10
          bg-slate-950/98
          backdrop-blur-xl
          transition-all duration-300
          lg:hidden
          ${
            open
              ? 'max-h-[600px] opacity-100'
              : 'max-h-0 opacity-0'
          }
        `}
      >
        <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8">

          {/* Mobile Links */}
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={handleLinkClick}
                className="
                  rounded-xl
                  px-4 py-3.5
                  text-sm font-medium
                  text-slate-300
                  transition
                  hover:bg-white/5
                  hover:text-teal-300
                "
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="my-5 h-px bg-white/10" />

          {/* Mobile Login / Register */}
          <div className="grid grid-cols-2 gap-3">

            <Link
              href="/login"
              onClick={handleLinkClick}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border border-white/15
                bg-white/5
                px-4 py-3
                text-sm font-semibold
                text-white
                transition
                hover:border-teal-400/50
                hover:bg-teal-400/10
                hover:text-teal-300
              "
            >
              <LogIn size={17} />
              Login
            </Link>

            <Link
              href="/register"
              onClick={handleLinkClick}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-teal-400
                to-cyan-400
                px-4 py-3
                text-sm font-bold
                text-slate-950
                transition
                hover:opacity-90
              "
            >
              <UserPlus size={17} />
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}