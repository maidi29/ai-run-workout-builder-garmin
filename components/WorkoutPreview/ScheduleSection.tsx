import { View, TouchableOpacity, StyleSheet } from "react-native";
import { AppText as Text } from "../AppText";
import { ToggleSwitch } from "../../components";
import { colors, fontSize, fontFamily } from "../../theme";
import { formatDateDisplay, getTodayDate } from "../../utils/format";

interface ScheduleSectionProps {
  scheduleEnabled: boolean;
  scheduleDate: string;
  onToggleSchedule: () => void;
  onDateChange: (date: string) => void;
}

export function ScheduleSection({
  scheduleEnabled,
  scheduleDate,
  onToggleSchedule,
  onDateChange,
}: ScheduleSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Schedule workout</Text>
        <ToggleSwitch value={scheduleEnabled} onToggle={onToggleSchedule} />
      </View>

      {scheduleEnabled && (
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>
            Scheduled for: {formatDateDisplay(scheduleDate)}
          </Text>
          <View style={styles.dateChips}>
            <TouchableOpacity
              style={[
                styles.chip,
                scheduleDate === getTodayDate() && styles.chipActive,
              ]}
              onPress={() => onDateChange(getTodayDate())}
            >
              <Text
                style={[
                  styles.chipText,
                  scheduleDate === getTodayDate() && styles.chipTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>
            {[1, 2, 3].map((offset) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const dayName = d.toLocaleDateString(undefined, {
                weekday: "short",
              });
              return (
                <TouchableOpacity
                  key={offset}
                  style={[
                    styles.chip,
                    scheduleDate === ds && styles.chipActive,
                  ]}
                  onPress={() => onDateChange(ds)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      scheduleDate === ds && styles.chipTextActive,
                    ]}
                  >
                    {dayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderColor: colors.border,
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  dateSection: {
    marginTop: 12,
  },
  dateLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dateChips: {
    flexDirection: "row",
    gap: 4,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
});
