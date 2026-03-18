'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MeetingFormData {
  title: string;
  date: string;
  time: string;
  participants: string;
}

export default function MeetingsPage() {
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    date: '',
    time: '',
    participants: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement meeting creation
      console.log('Creating meeting:', formData);
    } catch (err) {
      console.error('Error creating meeting:', err);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Meetings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Meeting Title
                </label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                  Time
                </label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="participants" className="block text-sm font-medium text-gray-700">
                  Participants
                </label>
                <Input
                  id="participants"
                  type="text"
                  value={formData.participants}
                  onChange={handleChange}
                  placeholder="Enter email addresses separated by commas"
                  required
                />
              </div>
              
              <Button type="submit">Schedule Meeting</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">No upcoming meetings scheduled.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 