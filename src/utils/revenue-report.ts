import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { getItemRevenue, type InventoryItem } from '@/providers/inventory-store';

type RevenueReportInput = {
  soldItems: InventoryItem[];
  totalRevenue: number;
  totalSoldUnits: number;
  reportDateKey: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatReportDate(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`));
}

function buildRevenueReportHtml({
  soldItems,
  totalRevenue,
  totalSoldUnits,
  reportDateKey,
}: RevenueReportInput) {
  const reportDate = formatReportDate(reportDateKey);
  const rows =
    soldItems.length === 0
      ? '<tr><td colspan="4" style="padding: 18px; color: #6B7280; text-align: center;">No sales recorded yet.</td></tr>'
      : soldItems
          .map((item) => {
            const revenue = getItemRevenue(item);
            const priceLabel = item.isVariablePrice ? 'Entered per sale' : `$${item.price.toFixed(2)}`;

            return `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${item.soldToday}</td>
                <td>${priceLabel}</td>
                <td>$${revenue.toFixed(2)}</td>
              </tr>
            `;
          })
          .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #111827;
            padding: 28px;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }
          p {
            margin: 0;
            color: #6B7280;
            font-size: 14px;
          }
          .summary {
            margin: 24px 0;
            display: flex;
            gap: 12px;
          }
          .card {
            flex: 1;
            border: 1px solid #E5E7EB;
            border-radius: 16px;
            padding: 16px;
            background: #F9FAFB;
          }
          .label {
            font-size: 12px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 6px;
          }
          .value {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            text-align: left;
            padding: 14px 10px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 14px;
          }
          th {
            color: #6B7280;
            font-weight: 600;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #9CA3AF;
          }
          @page {
            margin: 24px;
          }
        </style>
      </head>
      <body>
        <h1>Revenue Report</h1>
        <p>Daily sales snapshot generated from the current app data.</p>
        <p style="margin-top: 6px;"><strong>Report date:</strong> ${escapeHtml(reportDate)}</p>

        <div class="summary">
          <div class="card">
            <div class="label">Total Revenue</div>
            <div class="value">$${totalRevenue.toFixed(2)}</div>
          </div>
          <div class="card">
            <div class="label">Units Sold</div>
            <div class="value">${totalSoldUnits}</div>
          </div>
          <div class="card">
            <div class="label">Sold Items</div>
            <div class="value">${soldItems.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Units</th>
              <th>Price</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">Generated on ${new Date().toLocaleString()}</div>
      </body>
    </html>
  `;
}

export async function exportRevenueReport(input: RevenueReportInput) {
  const html = buildRevenueReportHtml(input);
  const { uri } = await Print.printToFileAsync({
    html,
    width: 612,
    height: 792,
    margins: {
      left: 24,
      right: 24,
      top: 24,
      bottom: 24,
    },
  });

  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      UTI: 'com.adobe.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Export Revenue Report',
    });
    return;
  }

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    await Print.printAsync({ uri });
  }
}
