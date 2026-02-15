import clsx from 'clsx';

export const Loader = ({ text = "Processing..." }: { text?: string }) => (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">{text}</p>
    </div>
);
