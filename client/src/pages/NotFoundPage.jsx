import React from "react";
import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";

const NotFoundPage = () => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="text-center space-y-8 max-w-lg mx-auto">
                <div className="relative">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="absolute top-0 right-1/4 animate-bounce">
                        <span className="text-6xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent opacity-20">
                            404
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight">
                        Page Not Found
                    </h1>
                    <p className="text-lg text-text-secondary leading-relaxed">
                        Oops! The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/">
                        <Button className="flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 shadow-lg hover:shadow-primary-500/25 transition-all">
                            <Home className="w-5 h-5" />
                            Return Home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="px-8 py-3"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
