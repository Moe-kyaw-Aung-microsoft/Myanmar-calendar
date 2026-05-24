/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Moon, Plus, Trash2, Repeat } from 'lucide-react';
import { Mycal } from 'mycal';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('myanmar_calendar_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventRecurrence, setNewEventRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');

  const saveEvents = (updatedEvents: CalendarEvent[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('myanmar_calendar_events', JSON.stringify(updatedEvents));
  };

  const addEvent = () => {
    if (!newEventTitle.trim()) return;
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newEventTitle,
      date: format(selectedDate, 'yyyy-MM-dd'),
      recurrence: newEventRecurrence,
    };
    saveEvents([...events, event]);
    setNewEventTitle('');
  };

  const deleteEvent = (id: string) => {
    saveEvents(events.filter(e => e.id !== id));
  };

  const isEventOnDate = (event: CalendarEvent, date: Date) => {
    const eventDate = new Date(event.date);
    const targetDate = new Date(format(date, 'yyyy-MM-dd'));
    const baseDate = new Date(format(eventDate, 'yyyy-MM-dd'));

    if (isSameDay(targetDate, baseDate)) return true;
    if (event.recurrence === 'none') return false;
    if (targetDate < baseDate) return false;

    if (event.recurrence === 'daily') return true;
    if (event.recurrence === 'weekly') {
      return targetDate.getDay() === baseDate.getDay();
    }
    if (event.recurrence === 'monthly') {
      return targetDate.getDate() === baseDate.getDate();
    }
    return false;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(e => isEventOnDate(e, date));
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = (day: Date) => setSelectedDate(day);

  const getDetailedLunarPhase = (mDate: Mycal) => {
    const phase = mDate.day.mp.en;
    const dayStr = mDate.day.fd.en;
    
    if (phase === 'Full Moon') return 'Full Moon';
    if (phase === 'New Moon') return 'New Moon';
    
    const day = parseInt(dayStr, 10);
    
    if (phase === 'Waxing') {
      if (day >= 1 && day <= 6) return 'Waxing Crescent';
      if (day === 7 || day === 8) return 'First Quarter';
      if (day >= 9 && day <= 14) return 'Waxing Gibbous';
    } else if (phase === 'Waning') {
      if (day >= 1 && day <= 6) return 'Waning Gibbous';
      if (day === 7 || day === 8) return 'Third Quarter';
      if (day >= 9) return 'Waning Crescent';
    }
    
    return phase;
  };

  const getNextPhaseInfo = (date: Date) => {
    let days = 0;
    const currentMDate = new Mycal(format(date, 'yyyy-MM-dd'));
    const currentPhase = getDetailedLunarPhase(currentMDate);
    let checkDate = addDays(date, 1);
    
    // Safety break at 35 days
    while (days < 35) {
      days++;
      const nextMDate = new Mycal(format(checkDate, 'yyyy-MM-dd'));
      const nextPhase = getDetailedLunarPhase(nextMDate);
      if (nextPhase !== currentPhase) {
        return { days, nextPhase };
      }
      checkDate = addDays(checkDate, 1);
    }
    return null;
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDate(new Date());
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-xs uppercase tracking-wider text-gray-500 py-3">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }

    return <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Calculate Myanmar Date
        const mDate = new Mycal(format(day, 'yyyy-MM-dd'));
        let myDayStr = '';
        
        if (mDate.day.mp.en === 'Full Moon') {
          myDayStr = 'လပြည့်';
        } else if (mDate.day.mp.en === 'New Moon') {
          myDayStr = 'လကွယ်';
        } else {
          myDayStr = `${mDate.day.mp.my} ${mDate.day.fd.my}`;
        }

        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        const dayEvents = getEventsForDate(day);

        days.push(
          <div
            className={`min-h-[100px] p-2 border-r border-b border-gray-100 relative cursor-pointer transition-all duration-200
              ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white text-gray-800'}
              ${isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/30 z-10' : 'hover:bg-gray-50'}
            `}
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${isToday ? 'bg-indigo-600 text-white shadow-sm' : ''}
                  ${isSelected && !isToday ? 'bg-indigo-100 text-indigo-700' : ''}
                `}
              >
                {formattedDate}
              </span>
              <span className={`text-xs font-medium ${isCurrentMonth ? 'text-amber-600' : 'text-amber-400/60'}`}>
                {mDate.day.fd.my}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-center font-medium">
              <span className={isCurrentMonth ? 'text-gray-500' : 'text-gray-400/60'}>
                {myDayStr}
              </span>
            </div>
            
            {dayEvents.length > 0 && (
              <div className="mt-auto pt-1 flex flex-wrap gap-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[8px] text-indigo-500 font-bold">+{dayEvents.length - 3}</div>
                )}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex-1 overflow-y-auto bg-white">{rows}</div>;
  };

  const getMaharboteDetails = (mDate: Mycal) => {
    const branch = mDate.maharbote;
    const weekday = mDate.weekday.en;

    const branchMeanings: Record<string, { en: string, meaning: string, description: string }> = {
      'ဘင်္ဂ': { 
        en: 'Binga', 
        meaning: 'Destruction / Change',
        description: 'Represents endings that lead to new beginnings. Characterized by a changeable and dynamic nature.'
      },
      'အထွန်း': { 
        en: 'Ahtun', 
        meaning: 'Success / Illumination',
        description: 'Symbolizes rapid success, popularity, and the ability to shine brightly in any field.'
      },
      'ရာဇာ': { 
        en: 'Yaza', 
        meaning: 'King / Leadership',
        description: 'Represents authority, command, and kingly qualities. Destined for leadership and prominence.'
      },
      'အဓိပတိ': { 
        en: 'Adipati', 
        meaning: 'Supremacy / Mastery',
        description: 'The highest peak of excellence and supremacy. Represents mastery over tasks and high social status.'
      },
      'မရဏ': { 
        en: 'Marana', 
        meaning: 'Hidden / Depth',
        description: 'Symbolizes hidden things, deep introspection, or the mystical. Suggests a serious and thoughtful nature.'
      },
      'သိုက်': { 
        en: 'Thike', 
        meaning: 'Treasure / Wealth',
        description: 'Represents accumulated wealth, legacy, and stability. Often associated with hidden talents and resources.'
      },
      'ပုတိ': { 
        en: 'Puti', 
        meaning: 'Imperfect / Broken',
        description: 'Represents the process of refining wisdom from flaws. Suggests working with complex or fragile situations.'
      }
    };

    const animalMeanings: Record<string, { animal: string, myAnimal: string, traits: string }> = {
      'Sunday': { animal: 'Garuda', myAnimal: 'ဂဠုန်', traits: 'Independent, ambitious, energetic leader' },
      'Monday': { animal: 'Tiger', myAnimal: 'ကျား', traits: 'Intelligent, intuitive, detail-oriented' },
      'Tuesday': { animal: 'Lion', myAnimal: 'ခြင်္သေ့', traits: 'Courageous, active, broad-minded' },
      'Wednesday': { animal: 'Tusked Elephant', myAnimal: 'ဆင်', traits: 'Unpredictable, enthusiastic, spontaneous' },
      'Thursday': { animal: 'Rat', myAnimal: 'ကြွက်', traits: 'Clever, witty, adaptable, quick-thinker' },
      'Friday': { animal: 'Guinea Pig', myAnimal: 'ပူး', traits: 'Artistic, creative, loving, imaginative' },
      'Saturday': { animal: 'Dragon / Naga', myAnimal: 'နဂါး', traits: 'Responsible, structured, disciplined' },
    };

    return {
      branchInfo: branchMeanings[branch] || { en: branch, meaning: 'Unknown', description: 'No description available.' },
      animalInfo: animalMeanings[weekday] || { animal: 'Unknown', myAnimal: '', traits: 'Unknown' }
    };
  };

  const getChineseZodiacDetails = (mDate: Mycal) => {
    const sign = mDate.chineseZodiac.sign;
    
    const zodiacMeanings: Record<string, { traits: string }> = {
      'Rat': { traits: 'Quick-witted, resourceful, versatile, kind' },
      'Ox': { traits: 'Diligent, dependable, strong, determined' },
      'Tiger': { traits: 'Brave, confident, competitive, unpredictable' },
      'Rabbit': { traits: 'Quiet, elegant, kind, responsible' },
      'Dragon': { traits: 'Confident, intelligent, enthusiastic' },
      'Snake': { traits: 'Enigmatic, intelligent, wise' },
      'Horse': { traits: 'Animated, active, energetic' },
      'Goat': { traits: 'Calm, gentle, sympathetic' },
      'Monkey': { traits: 'Sharp, smart, curiosity' },
      'Rooster': { traits: 'Observant, hardworking, courageous' },
      'Dog': { traits: 'Lovely, honest, prudent' },
      'Pig': { traits: 'Compassionate, generous, diligent' }
    };

    return zodiacMeanings[sign] || { traits: 'Unknown' };
  };

  const renderSidebar = () => {
    const mDate = new Mycal(format(selectedDate, 'yyyy-MM-dd'));
    let myDateStr = '';
    
    if (mDate.day.mp.en === 'Full Moon') {
      myDateStr = `${mDate.month.my}လပြည့်`;
    } else if (mDate.day.mp.en === 'New Moon') {
      myDateStr = `${mDate.month.my}လကွယ်`;
    } else {
      myDateStr = `${mDate.month.my}${mDate.day.mp.my} ${mDate.day.fd.my} ရက်`;
    }

    const maharboteDetails = getMaharboteDetails(mDate);
    const chineseZodiacDetails = getChineseZodiacDetails(mDate);
    const nextPhase = getNextPhaseInfo(selectedDate);
    const selectedDayEvents = getEventsForDate(selectedDate);

    return (
      <div className="w-full md:w-80 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 p-6 flex flex-col overflow-y-auto">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Selected Date</h3>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="text-5xl font-bold text-indigo-600 mb-2 tracking-tighter">
            {format(selectedDate, 'd')}
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {format(selectedDate, 'EEEE')}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {format(selectedDate, 'MMMM yyyy')}
          </div>
        </div>

        {/* Events Section */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Events</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
              {selectedDayEvents.length}
            </span>
          </h4>
          
          <div className="space-y-2 mb-4">
            {selectedDayEvents.map(event => (
              <div key={event.id} className="group flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate">{event.title}</span>
                  {event.recurrence !== 'none' && (
                    <div className="flex items-center text-[10px] text-indigo-500 font-medium mt-0.5">
                      <Repeat className="w-2.5 h-2.5 mr-1" />
                      {event.recurrence.charAt(0).toUpperCase() + event.recurrence.slice(1)}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => deleteEvent(event.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {selectedDayEvents.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-xs text-gray-400 font-medium italic">No events scheduled</p>
              </div>
            )}
          </div>

          <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <input
              type="text"
              placeholder="Add new event..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300"
              onKeyDown={(e) => e.key === 'Enter' && addEvent()}
            />
            <div className="flex space-x-1">
              {(['none', 'daily', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewEventRecurrence(type)}
                  className={`flex-1 text-[10px] py-1.5 rounded-md font-semibold transition-all
                    ${newEventRecurrence === type 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white text-gray-400 hover:text-indigo-600 border border-indigo-50 hover:border-indigo-200'}
                  `}
                >
                  {type === 'none' ? 'Once' : type.charAt(0).toUpperCase() + type.slice(1, 3)}
                </button>
              ))}
            </div>
            <button
              onClick={addEvent}
              disabled={!newEventTitle.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-sm border border-amber-100/50">
          <h4 className="text-sm font-bold text-amber-800/70 uppercase tracking-wider mb-5 flex items-center space-x-2">
            <span>Myanmar Calendar</span>
          </h4>
          <div className="space-y-5">
            <div>
              <div className="text-xs font-semibold text-amber-600/60 mb-1 uppercase tracking-wider">Year</div>
              <div className="font-medium text-amber-900 text-lg">
                {mDate.year.my} ခုနှစ်
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-600/60 mb-1 uppercase tracking-wider">Month</div>
              <div className="font-medium text-amber-900 text-lg">
                {mDate.month.my}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-600/60 mb-1 uppercase tracking-wider">Date</div>
              <div className="font-medium text-amber-900 text-lg">
                {myDateStr}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-xs font-semibold text-amber-600/60 mb-1 uppercase tracking-wider">Weekday</div>
                <div className="font-medium text-amber-900">
                  {mDate.weekday.my}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-600/60 mb-1 uppercase tracking-wider">Maharbote</div>
                <div className="font-medium text-amber-900">
                  {mDate.maharbote}
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-200/50">
              <div className="text-xs font-semibold text-amber-600/60 mb-1 uppercase tracking-wider">Lunar Phase</div>
              <div className="font-medium text-amber-900 flex items-center space-x-2">
                <Moon className="w-4 h-4 text-amber-600" />
                <span>{getDetailedLunarPhase(mDate)}</span>
              </div>
              <div className="mt-1 flex flex-col space-y-0.5">
                <div className="text-[10px] text-amber-700/60 font-medium">
                  {mDate.day.mp.en} {mDate.day.fd.en}
                </div>
                {nextPhase && (
                  <div className="text-[10px] text-indigo-600/70 font-semibold bg-indigo-100/50 w-fit px-1.5 py-0.5 rounded mt-0.5 border border-indigo-200/50">
                    {nextPhase.days} {nextPhase.days === 1 ? 'day' : 'days'} until {nextPhase.nextPhase}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-amber-200/50 mt-4">
              <div className="text-xs font-semibold text-amber-600/60 mb-3 uppercase tracking-wider">Chinese Zodiac</div>
              <div className="bg-white/50 rounded-xl p-3 border border-amber-100">
                <div className="font-medium text-amber-900 flex justify-between items-center mb-1">
                  <span>{mDate.chineseZodiac.sign} ({mDate.chineseZodiac.signInBurmese})</span>
                </div>
                <div className="text-xs text-amber-700/70">{chineseZodiacDetails.traits}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-200/50 mt-4">
              <div className="text-xs font-semibold text-amber-600/60 mb-3 uppercase tracking-wider">Maharbote Branch (ဖွားဇာတာ)</div>
              <div className="bg-white/50 rounded-xl p-3 border border-amber-100">
                <div className="font-medium text-amber-900 flex justify-between items-center mb-1">
                  <span>{mDate.maharbote} ({maharboteDetails.branchInfo.en})</span>
                </div>
                <div className="text-xs text-amber-800 font-bold mb-1">{maharboteDetails.branchInfo.meaning}</div>
                <div className="text-xs text-amber-700/70 leading-relaxed italic">{maharboteDetails.branchInfo.description}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-200/50 mt-4">
              <div className="text-xs font-semibold text-amber-600/60 mb-3 uppercase tracking-wider">Day Animal (နေ့နံ)</div>
              <div className="bg-white/50 rounded-xl p-3 border border-amber-100">
                <div className="font-medium text-amber-900 flex justify-between items-center mb-1">
                  <span>{maharboteDetails.animalInfo.animal} ({maharboteDetails.animalInfo.myAnimal})</span>
                </div>
                <div className="text-xs text-amber-700/70">{maharboteDetails.animalInfo.traits}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] min-h-[600px]">
        <div className="flex-1 flex flex-col min-w-0">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
        {renderSidebar()}
      </div>
    </div>
  );
}

