import React from 'react';
import {
  Users,
  Megaphone,
  MessageSquare,
  Plus,
  ChevronRight,
  Shield,
  UserPlus,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { cn } from '../../utils/cn';

export const WhatsAppCommunityDetailsView = ({
  community,
  onOpenSubgroupChat,
  onAddSubgroup,
}) => {
  if (!community) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111B21] select-none overflow-y-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222D34] bg-[#202C33]">
        <h3 className="text-base font-bold text-[#E9EDEF]">Community Details</h3>
      </div>

      {/* Community Header Banner */}
      <div className="flex flex-col items-center p-8 border-b border-[#222D34] bg-gradient-to-b from-[#202C33]/60 to-[#111B21]">
        <div className="relative mb-4">
          <Avatar
            src={community.avatar}
            name={community.name}
            size="xl"
            className="w-24 h-24 text-2xl shadow-xl ring-4 ring-[#202C33]"
          />
        </div>
        <h2 className="text-xl font-bold text-[#E9EDEF] text-center">{community.name}</h2>
        <p className="text-xs text-[#00A884] font-semibold mt-1">
          Community • {community.membersCount || 128} members
        </p>
        <p className="text-sm text-[#8696A0] text-center max-w-md mt-2 leading-relaxed">
          {community.description || 'Welcome to our campus community group! Join discussions, ask questions, and share notes.'}
        </p>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => onAddSubgroup?.(community)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] text-xs font-semibold border border-[#2A3942] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#00A884]" />
            Add Group
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A884] hover:bg-[#02906F] text-white text-xs font-bold transition-colors shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Invite Members
          </button>
        </div>
      </div>

      {/* Community Groups List */}
      <div className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full">
        {/* Announcements Channel */}
        <div>
          <h4 className="text-xs font-bold text-[#8696A0] uppercase tracking-wider mb-2">
            Announcements
          </h4>
          <div
            onClick={() => onOpenSubgroupChat?.({
              id: `${community.id}_announcements`,
              name: `${community.name} Announcements`,
              avatar: community.avatar,
              isGroup: true,
            })}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#202C33] hover:bg-[#2A3942] cursor-pointer transition-colors border border-[#2A3942]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#00A884]/15 text-[#00A884] flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#E9EDEF]">Announcements</p>
                <p className="text-xs text-[#8696A0]">Official updates from community admins</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8696A0]" />
          </div>
        </div>

        {/* Other Subgroups */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-[#8696A0] uppercase tracking-wider">
              Groups in this community ({community.groups?.length || 3})
            </h4>
          </div>

          <div className="space-y-2">
            {(community.groups || [
              { id: 'sub_1', name: 'General Discussions', members: 84 },
              { id: 'sub_2', name: 'Study & Notes Sharing', members: 42 },
              { id: 'sub_3', name: 'Projects & Coding Help', members: 56 },
            ]).map((grp) => (
              <div
                key={grp.id}
                onClick={() => onOpenSubgroupChat?.({
                  id: `${community.id}_${grp.id}`,
                  name: grp.name,
                  avatar: community.avatar,
                  isGroup: true,
                })}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202C33] hover:bg-[#2A3942] cursor-pointer transition-colors border border-[#2A3942]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#111B21] text-[#00A884] flex items-center justify-center shrink-0 border border-[#2A3942]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#E9EDEF]">{grp.name}</p>
                    <p className="text-xs text-[#8696A0]">{grp.members || 20} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#111B21] hover:bg-[#00A884] text-[#E9EDEF] transition-colors"
                  >
                    Open
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#8696A0]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Encryption Notice */}
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-[#8696A0]">
          <Shield className="w-4 h-4 text-[#00A884]" />
          <span>Admin-moderated community with end-to-end encrypted subgroups</span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCommunityDetailsView;

