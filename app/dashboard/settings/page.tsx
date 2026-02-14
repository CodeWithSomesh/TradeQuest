'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const instruments = ['EUR/USD', 'BTC/USD', 'Gold', 'S&P 500']
const focusAreas = [
  { label: 'Technical Analysis', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { label: 'Psychology', className: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  { label: 'Risk Management', className: 'border-white/20 bg-white/5 text-muted-foreground' },
]

export default function SettingsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 max-w-4xl">
        {/* Trading Profile */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Trading Profile</CardTitle>
            <CardDescription>Instruments and risk preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Followed Instruments</Label>
              <div className="flex flex-wrap gap-2">
                {instruments.map((inst) => (
                  <span
                    key={inst}
                    className="inline-flex items-center rounded-full border border-[#FF444F]/30 bg-[#FF444F]/10 px-3 py-1 text-xs font-medium text-[#FF444F]"
                  >
                    {inst}
                  </span>
                ))}
                <Button variant="outline" size="sm" className="rounded-full border-dashed border-white/30 text-muted-foreground hover:bg-white/5">
                  + Add
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trading-style">Trading Style</Label>
                <Select defaultValue="position">
                  <SelectTrigger id="trading-style" className="w-full">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="position">Position Trader</SelectItem>
                    <SelectItem value="swing">Swing Trader</SelectItem>
                    <SelectItem value="day">Day Trader</SelectItem>
                    <SelectItem value="scalper">Scalper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                <Select defaultValue="moderate">
                  <SelectTrigger id="risk-tolerance" className="w-full">
                    <SelectValue placeholder="Select tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Coach Settings */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-base">AI Coach Settings</CardTitle>
            <CardDescription>Intervention level and alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intervention">Intervention Sensitivity</Label>
              <Select defaultValue="moderate">
                <SelectTrigger id="intervention" className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low – Fewer alerts, more freedom</SelectItem>
                  <SelectItem value="moderate">Moderate – Balance alerts and freedom</SelectItem>
                  <SelectItem value="high">High – Proactive guidance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Alert Types</Label>
              <div className="space-y-2">
                {[
                  { id: 'revenge', label: 'Revenge trading warnings' },
                  { id: 'overtrading', label: 'Overtrading alerts' },
                  { id: 'praise', label: 'Good behavior praise' },
                  { id: 'patterns', label: 'Pattern insights' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox id={item.id} defaultChecked={item.id !== 'patterns'} />
                    <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quiet Hours</Label>
              <p className="text-xs text-muted-foreground mb-2">Coach will not send alerts during these hours</p>
              <div className="flex items-center gap-2">
                <Input type="time" defaultValue="22:00" className="w-[120px]" />
                <span className="text-muted-foreground">to</span>
                <Input type="time" defaultValue="06:00" className="w-[120px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Preferences */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Learning Preferences</CardTitle>
            <CardDescription>How you learn and focus areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learning-style">Learning Style</Label>
              <Select defaultValue="analytical">
                <SelectTrigger id="learning-style" className="w-full">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytical">Analytical – Data and statistics</SelectItem>
                  <SelectItem value="visual">Visual – Charts and patterns</SelectItem>
                  <SelectItem value="practical">Practical – Live examples</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Learning Goals</Label>
              <textarea
                id="goals"
                rows={3}
                defaultValue="Improve entry timing and reduce emotional trading"
                className={cn(
                  'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Focus Areas</Label>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <span
                    key={area.label}
                    className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', area.className)}
                  >
                    {area.label}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Email and Deriv connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="john.trader@example.com"
                className="w-full max-w-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Deriv Account Connection</Label>
              <p className="text-xs text-muted-foreground">
                Enter your Deriv API token on the <strong>Dashboard</strong> (next to the balance) to connect and enable live trade data for the AI Coach.
              </p>
            </div>
            <div className="pt-2">
              <Button className="bg-[#FF444F] hover:bg-[#E63946] text-white">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
