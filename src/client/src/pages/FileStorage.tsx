import { Card } from "@/components/ui/card";
import { ExternalLink, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileStorage() {
    const fsUrl = "https://fs.metalogic.kz/";

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-purple-600" />
                        Файловое хранилище
                    </h2>
                </div>
                <Button variant="outline" asChild>
                    <a href={fsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Открыть в новой вкладке
                    </a>
                </Button>
            </div>

            <Card className="flex-1 overflow-hidden border-0 shadow-md bg-white">
                <iframe
                    src={fsUrl}
                    className="w-full h-full border-0"
                    title="File Storage"
                    allowFullScreen
                />
            </Card>
        </div>
    );
}