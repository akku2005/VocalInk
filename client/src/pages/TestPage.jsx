import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const TestPage = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent mb-4">
            Dark Theme & Glassmorphism Test
          </h1>
          <p className="text-text-secondary text-lg">
            Test the new dark theme with black background, white text, and glassmorphism cards
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Glassmorphism Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                This card uses glassmorphism styling with backdrop blur and transparency.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
              </div>
              <Button variant="primary" className="w-full">
                Primary Button
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Glassmorphism Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                Notice the beautiful glass effect with blur and transparency.
              </p>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full">Secondary</Button>
                <Button variant="outline" className="w-full">Outline</Button>
                <Button variant="ghost" className="w-full">Ghost</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Glassmorphism Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                The dark theme uses pure black background with white text.
              </p>
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 rounded-lg text-white text-center mb-4">
                Gradient Background
              </div>
              <Button variant="danger" className="w-full">
                Danger Button
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Form Elements Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Input Field
                  </label>
                  <Input placeholder="Type something here..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Another Input
                  </label>
                  <Input placeholder="With glassmorphism styling" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Button Variants
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="md" variant="secondary">Medium</Button>
                    <Button size="lg" variant="outline">Large</Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Badge Variants
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Color Palette Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Background Colors</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-background border border-border rounded-lg flex items-center justify-center text-xs">BG</div>
                  <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center text-xs">Surface</div>
                  <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center text-white text-xs">Primary</div>
                  <div className="w-12 h-12 bg-secondary-500 rounded-lg flex items-center justify-center text-white text-xs">Secondary</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Text Colors</h3>
                <div className="space-y-2">
                  <p className="text-text-primary">Primary Text Color</p>
                  <p className="text-text-secondary">Secondary Text Color</p>
                  <p className="text-primary-500">Primary Color Text</p>
                  <p className="text-success">Success Color Text</p>
                  <p className="text-warning">Warning Color Text</p>
                  <p className="text-error">Error Color Text</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Gradient Test</h3>
                <div className="h-16 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  Beautiful Gradient
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPage; 