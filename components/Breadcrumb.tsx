import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
      <Link
        href="/"
        className="hover:text-white transition"
      >
        MEGA
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-gray-600">&gt;</span>
          {index === items.length - 1 ? (
            <span className="text-white">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-white transition"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
